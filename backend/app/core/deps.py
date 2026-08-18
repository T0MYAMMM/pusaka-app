"""
FastAPI dependencies: authenticated user + vault key resolution.

Two auth mechanisms are supported:
  1. Cookie (access_token) — used by the web app (session-based)
  2. API key (Authorization: Bearer cmv1_<hex>) — used by CLI + CI/CD

API key vault access uses the server-side recovery key so no password is
required. This is the same trust model as password reset.
"""

import hashlib
from datetime import UTC, datetime

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis_client
from app.core.database import get_db
from app.core.security import decode_access_token, decrypt_vault_key_for_recovery
from app.models.models import User, UserAPIKey


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    # --- Cookie auth (web app) ---
    if access_token:
        user_id = decode_access_token(access_token)
        if user_id is None:
            raise credentials_exception
        result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
        user = result.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return user

    # --- API key auth (Bearer token) ---
    if authorization and authorization.startswith("Bearer cmv1_"):
        raw_key = authorization.removeprefix("Bearer ")
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        result = await db.execute(
            select(UserAPIKey).where(
                UserAPIKey.key_hash == key_hash,
                UserAPIKey.is_active == True,
            )
        )
        api_key = result.scalar_one_or_none()

        if api_key is None:
            raise credentials_exception

        # Check expiry if set
        if api_key.expires_at and datetime.now(UTC) > api_key.expires_at.replace(tzinfo=UTC):
            raise HTTPException(status_code=401, detail="API key has expired")

        # Update last_used_at (best-effort, don't fail on error)
        api_key.last_used_at = datetime.now(UTC)
        await db.commit()

        result = await db.execute(select(User).where(User.id == api_key.user_id, User.is_active == True))
        user = result.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return user

    raise credentials_exception


async def get_vault_key_dep(
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    current_user: User = Depends(get_current_user),
) -> bytes:
    """
    Resolve the vault key for the current user.

    Cookie auth: reads from Redis (requires active session).
    API key auth: decrypts using server recovery key (no Redis required).
    """
    # API key path — use server-side recovery decryption
    if not access_token and authorization and authorization.startswith("Bearer cmv1_"):
        if not current_user.vault_key_recovery_encrypted:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vault recovery key not set — log in via web app first",
            )
        return decrypt_vault_key_for_recovery(current_user.vault_key_recovery_encrypted)

    # Cookie path — read from Redis
    vault_key = await redis_client.get_vault_key(current_user.id)
    if vault_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please log in again",
        )
    return vault_key


async def require_write_api_key(
    authorization: str | None = Header(default=None),
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    For API key requests, enforce that the key has 'write' scope.
    Cookie-authenticated requests are always allowed (scope not applicable).
    """
    if access_token:
        return  # cookie auth — no scope restriction

    if not authorization or not authorization.startswith("Bearer cmv1_"):
        return  # not an API key request

    raw_key = authorization.removeprefix("Bearer ")
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    result = await db.execute(
        select(UserAPIKey).where(UserAPIKey.key_hash == key_hash, UserAPIKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()
    if api_key and api_key.scope != "write":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires a write-scoped API key",
        )
