"""Secure Note business logic."""

import math
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_for_user, encrypt_for_user
from app.models.models import SecureNote
from app.schemas.schemas import NoteCreate, NoteUpdate


async def list_notes(
    db: AsyncSession,
    user_id: int,
    q: str | None = None,
    favorites_only: bool = False,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[SecureNote], int]:
    stmt = select(SecureNote).where(SecureNote.user_id == user_id)

    if q:
        stmt = stmt.where(
            or_(
                SecureNote.title.ilike(f"%{q}%"),
                SecureNote.tags.ilike(f"%{q}%"),
            )
        )
    if favorites_only:
        stmt = stmt.where(SecureNote.is_favorite == True)  # noqa: E712

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.order_by(SecureNote.updated_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all(), total


async def get_note(db: AsyncSession, note_id: int, user_id: int) -> SecureNote | None:
    result = await db.execute(
        select(SecureNote).where(SecureNote.id == note_id, SecureNote.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_note(db: AsyncSession, user_id: int, data: NoteCreate, vault_key: bytes) -> SecureNote:
    note = SecureNote(
        user_id=user_id,
        title=data.title,
        content_encrypted=encrypt_for_user(vault_key, data.content) if data.content else "",
        type=data.type,
        is_favorite=data.is_favorite,
        tags=data.tags,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def update_note(db: AsyncSession, note: SecureNote, data: NoteUpdate, vault_key: bytes) -> SecureNote:
    update_data = data.model_dump(exclude_unset=True)

    if "content" in update_data:
        content = update_data.pop("content")
        note.content_encrypted = encrypt_for_user(vault_key, content) if content else ""

    for field, value in update_data.items():
        setattr(note, field, value)

    note.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, note: SecureNote) -> None:
    await db.delete(note)
    await db.commit()


async def toggle_favorite(db: AsyncSession, note: SecureNote) -> SecureNote:
    note.is_favorite = not note.is_favorite
    await db.commit()
    await db.refresh(note)
    return note


async def touch_last_accessed(db: AsyncSession, note: SecureNote) -> None:
    note.last_accessed = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)


def decrypt_note(note: SecureNote, vault_key: bytes) -> str:
    return decrypt_for_user(vault_key, note.content_encrypted) if note.content_encrypted else ""


def pages(total: int, limit: int) -> int:
    return math.ceil(total / limit) if limit else 1
