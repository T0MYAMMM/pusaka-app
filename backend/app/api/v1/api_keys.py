"""
API key management endpoints.

Keys are used for machine authentication (CLI, CI/CD).
Format: cmv1_<64-hex-chars>
Only the SHA-256 hash is stored; the full key is shown once on creation.
"""

import hashlib
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, UserAPIKey
from app.schemas.schemas import APIKeyCreate, APIKeyCreatedResponse, APIKeyResponse

router = APIRouter()

_PREFIX = "cmv1_"


def _generate_key() -> tuple[str, str, str]:
    """Return (full_key, key_hash, key_prefix)."""
    raw = os.urandom(32).hex()  # 64 hex chars
    full_key = f"{_PREFIX}{raw}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_prefix = f"{_PREFIX}{raw[:8]}"
    return full_key, key_hash, key_prefix


@router.get("/", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserAPIKey).where(
            UserAPIKey.user_id == current_user.id,
            UserAPIKey.is_active == True,
        )
    )
    return list(result.scalars().all())


@router.post("/", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    full_key, key_hash, key_prefix = _generate_key()

    api_key = UserAPIKey(
        user_id=current_user.id,
        name=payload.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        scope=payload.scope,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return APIKeyCreatedResponse(
        **APIKeyResponse.model_validate(api_key).model_dump(),
        key=full_key,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserAPIKey).where(
            UserAPIKey.id == key_id,
            UserAPIKey.user_id == current_user.id,
        )
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = False
    await db.commit()
