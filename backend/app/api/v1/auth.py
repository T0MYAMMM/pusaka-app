import logging
import os
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis_client
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, get_vault_key_dep
from app.core.email import send_password_reset_email, send_verification_email
from app.core.limiter import limit
from app.core.security import (
    create_access_token,
    decrypt_vault_key_for_recovery,
    encrypt_vault_key_for_recovery,
    generate_vault_key,
    generate_vault_salt,
    hash_password,
    unwrap_vault_key,
    verify_password,
    wrap_vault_key,
)
from app.models.models import User
from app.schemas.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.activity_service import log_activity

logger = logging.getLogger(__name__)

router = APIRouter()

COOKIE_NAME = "access_token"
COOKIE_OPTS = dict(
    httponly=True,
    samesite="lax",
    secure=False,  # set True in production behind HTTPS
    max_age=settings.access_token_expire_minutes * 60,
)


def _generate_token() -> str:
    """Return a URL-safe 32-byte hex token."""
    return os.urandom(32).hex()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limit("10/minute")
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    existing_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate per-user vault key and wrap it with the user's password
    vault_salt = generate_vault_salt()
    vault_key = generate_vault_key()
    vault_key_enc = wrap_vault_key(vault_key, payload.password, vault_salt)
    vault_key_recovery_enc = encrypt_vault_key_for_recovery(vault_key)

    # Email verification token
    verification_token = _generate_token()

    user = User(
        username=payload.username,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hashed_password=hash_password(payload.password),
        vault_salt=vault_salt,
        vault_key_encrypted=vault_key_enc,
        vault_key_recovery_encrypted=vault_key_recovery_enc,
        is_email_verified=False,
        email_verification_token=verification_token,
        email_verification_sent_at=datetime.now(UTC),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Cache vault key in Redis for the session
    await redis_client.set_vault_key(user.id, vault_key, settings.vault_key_cache_ttl_seconds)

    token = create_access_token(user.id)
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTS)

    await send_verification_email(user.email, user.username, verification_token)
    await log_activity(db, user.id, "register", f"New user registered: {user.username}", request)
    return user


@router.post("/login", response_model=UserResponse)
@limit("20/minute")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == payload.username, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if settings.require_email_verification and not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Email address not verified. Check your inbox or request a new verification email.",
        )

    # Unwrap the user's vault key using their password, then cache in Redis
    vault_key = unwrap_vault_key(user.vault_key_encrypted, payload.password, user.vault_salt)
    await redis_client.set_vault_key(user.id, vault_key, settings.vault_key_cache_ttl_seconds)

    token = create_access_token(user.id)
    response.set_cookie(COOKIE_NAME, token, **COOKIE_OPTS)

    await log_activity(db, user.id, "login", f"User logged in: {user.username}", request)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await redis_client.delete_vault_key(current_user.id)
    response.delete_cookie(COOKIE_NAME)
    await log_activity(db, current_user.id, "logout", f"User logged out: {current_user.username}", request)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password", response_model=UserResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Re-wrap the existing vault_key under the new password (vault data unchanged)
    new_vault_key_encrypted = wrap_vault_key(vault_key, payload.new_password, current_user.vault_salt)

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.vault_key_encrypted = new_vault_key_encrypted
    await db.commit()
    await db.refresh(current_user)

    # vault_key itself hasn't changed — Redis cache remains valid
    return current_user


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using the token sent on registration."""
    result = await db.execute(select(User).where(User.email_verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if user.is_email_verified:
        return {"detail": "Email already verified"}

    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_sent_at = None
    await db.commit()

    return {"detail": "Email verified successfully"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
@limit("3/hour")
async def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resend email verification link to the currently logged-in user."""
    if current_user.is_email_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")

    token = _generate_token()
    current_user.email_verification_token = token
    current_user.email_verification_sent_at = datetime.now(UTC)
    await db.commit()

    await send_verification_email(current_user.email, current_user.username, token)
    return {"detail": "Verification email sent"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limit("5/hour")
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a password-reset link.
    Always returns 200 to avoid leaking whether the email is registered.
    """
    result = await db.execute(select(User).where(User.email == payload.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if user:
        token = _generate_token()
        user.password_reset_token = token
        user.password_reset_expires_at = datetime.now(UTC) + timedelta(hours=1)
        await db.commit()
        await send_password_reset_email(user.email, user.username, token)

    return {"detail": "If that email is registered you will receive a reset link shortly"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@limit("10/hour")
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password using a token from the email link.
    Re-wraps the vault_key so vault data is not lost.
    """
    result = await db.execute(select(User).where(User.password_reset_token == payload.token))
    user = result.scalar_one_or_none()

    if not user or not user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.now(UTC) > user.password_reset_expires_at.replace(tzinfo=UTC):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Recover vault_key using the server-side recovery copy, then re-wrap with new password
    vault_key = decrypt_vault_key_for_recovery(user.vault_key_recovery_encrypted)
    new_vault_key_encrypted = wrap_vault_key(vault_key, payload.new_password, user.vault_salt)

    user.hashed_password = hash_password(payload.new_password)
    user.vault_key_encrypted = new_vault_key_encrypted
    user.password_reset_token = None
    user.password_reset_expires_at = None
    await db.commit()

    return {"detail": "Password reset successfully. Please log in with your new password."}
