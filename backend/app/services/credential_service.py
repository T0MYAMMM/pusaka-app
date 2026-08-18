"""Credential business logic — encryption/decryption handled here."""

import hashlib
import math
from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_for_user, encrypt_for_user
from app.models.models import Credential
from app.schemas.schemas import CredentialCreate, CredentialUpdate, DuplicateGroup


async def list_credentials(
    db: AsyncSession,
    user_id: int,
    q: str | None = None,
    type_filter: str | None = None,
    env_filter: str | None = None,
    favorites_only: bool = False,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[Credential], int]:
    stmt = select(Credential).where(Credential.user_id == user_id)

    if q:
        stmt = stmt.where(
            or_(
                Credential.label.ilike(f"%{q}%"),
                Credential.username.ilike(f"%{q}%"),
                Credential.email.ilike(f"%{q}%"),
                Credential.note.ilike(f"%{q}%"),
                Credential.tags.ilike(f"%{q}%"),
            )
        )
    if type_filter and type_filter != "all":
        stmt = stmt.where(Credential.type == type_filter)
    if env_filter and env_filter != "all":
        stmt = stmt.where(Credential.env == env_filter)
    if favorites_only:
        stmt = stmt.where(Credential.is_favorite == True)  # noqa: E712

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.order_by(Credential.updated_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all(), total


async def list_expiring_credentials(
    db: AsyncSession,
    user_id: int,
    days: int = 30,
) -> list[Credential]:
    """Return credentials expiring within `days` days (or already expired)."""
    cutoff = datetime.now(UTC) + timedelta(days=days)
    result = await db.execute(
        select(Credential)
        .where(
            Credential.user_id == user_id,
            Credential.expires_at.isnot(None),
            Credential.expires_at <= cutoff,
        )
        .order_by(Credential.expires_at.asc())
    )
    return list(result.scalars().all())


async def find_duplicate_passwords(
    db: AsyncSession,
    user_id: int,
    vault_key: bytes,
) -> list[DuplicateGroup]:
    """
    Decrypt all credentials, group by password hash, return groups with >1 member.
    Passwords are hashed with SHA-256 before comparison — never logged.
    """
    result = await db.execute(
        select(Credential).where(
            Credential.user_id == user_id,
            Credential.password_encrypted != "",
        )
    )
    credentials = list(result.scalars().all())

    groups: dict[str, list[Credential]] = defaultdict(list)
    for cred in credentials:
        try:
            pw = decrypt_for_user(vault_key, cred.password_encrypted)
            if pw:
                pw_hash = hashlib.sha256(pw.encode()).hexdigest()
                groups[pw_hash].append(cred)
        except Exception:
            pass  # skip credentials that can't be decrypted

    return [
        DuplicateGroup(
            credential_ids=[c.id for c in group],
            label_hints=[c.label for c in group],
        )
        for group in groups.values()
        if len(group) > 1
    ]


async def get_credential(db: AsyncSession, credential_id: int, user_id: int) -> Credential | None:
    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_credential(
    db: AsyncSession, user_id: int, data: CredentialCreate, vault_key: bytes
) -> Credential:
    credential = Credential(
        user_id=user_id,
        label=data.label,
        type=data.type,
        website_url=data.website_url,
        username=data.username,
        email=data.email,
        password_encrypted=encrypt_for_user(vault_key, data.password) if data.password else "",
        secret_key_encrypted=encrypt_for_user(vault_key, data.secret_key) if data.secret_key else None,
        note=data.note,
        is_favorite=data.is_favorite,
        tags=data.tags,
        env=data.env,
        expires_at=data.expires_at,
    )
    db.add(credential)
    await db.commit()
    await db.refresh(credential)
    return credential


async def update_credential(
    db: AsyncSession, credential: Credential, data: CredentialUpdate, vault_key: bytes
) -> Credential:
    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        pw = update_data.pop("password")
        credential.password_encrypted = encrypt_for_user(vault_key, pw) if pw else ""

    if "secret_key" in update_data:
        sk = update_data.pop("secret_key")
        credential.secret_key_encrypted = encrypt_for_user(vault_key, sk) if sk else None

    for field, value in update_data.items():
        setattr(credential, field, value)

    credential.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(credential)
    return credential


async def delete_credential(db: AsyncSession, credential: Credential) -> None:
    await db.delete(credential)
    await db.commit()


async def toggle_favorite(db: AsyncSession, credential: Credential) -> Credential:
    credential.is_favorite = not credential.is_favorite
    await db.commit()
    await db.refresh(credential)
    return credential


async def touch_last_accessed(db: AsyncSession, credential: Credential) -> None:
    credential.last_accessed = datetime.now(UTC)
    await db.commit()
    await db.refresh(credential)


def decrypt_credential(credential: Credential, vault_key: bytes) -> dict:
    """Return a dict with decrypted password + secret_key for detail responses."""
    return {
        "password": decrypt_for_user(vault_key, credential.password_encrypted) if credential.password_encrypted else "",
        "secret_key": decrypt_for_user(vault_key, credential.secret_key_encrypted) if credential.secret_key_encrypted else None,
    }


def pages(total: int, limit: int) -> int:
    return math.ceil(total / limit) if limit else 1
