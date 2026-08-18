"""Document business logic — encrypted file storage."""

import math
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_bytes_for_user, encrypt_bytes_for_user
from app.models.models import Document
from app.schemas.schemas import DocumentUpdate


async def list_documents(
    db: AsyncSession,
    user_id: int,
    q: str | None = None,
    type_filter: str | None = None,
    favorites_only: bool = False,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[Document], int]:
    """Return a paginated list of documents for the user."""
    stmt = select(Document).where(Document.user_id == user_id)

    if q:
        stmt = stmt.where(
            or_(
                Document.title.ilike(f"%{q}%"),
                Document.description.ilike(f"%{q}%"),
                Document.file_name.ilike(f"%{q}%"),
                Document.tags.ilike(f"%{q}%"),
            )
        )
    if type_filter:
        stmt = stmt.where(Document.document_type == type_filter)
    if favorites_only:
        stmt = stmt.where(Document.is_favorite == True)  # noqa: E712

    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.order_by(Document.updated_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all(), total


async def get_document(db: AsyncSession, document_id: int, user_id: int) -> Document | None:
    """Fetch a single document by ID, scoped to the user."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_document(
    db: AsyncSession,
    user_id: int,
    title: str,
    description: str | None,
    document_type: str,
    file_name: str,
    file_size: int,
    mime_type: str,
    tags: str | None,
    expires_at: datetime | None,
    file_bytes: bytes,
    vault_key: bytes,
) -> Document:
    """Encrypt file bytes and persist a new Document record."""
    content_encrypted = encrypt_bytes_for_user(vault_key, file_bytes)
    doc = Document(
        user_id=user_id,
        title=title,
        description=description,
        document_type=document_type,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        tags=tags,
        expires_at=expires_at,
        content_encrypted=content_encrypted,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def update_document(
    db: AsyncSession,
    doc: Document,
    data: DocumentUpdate,
) -> Document:
    """Update document metadata (not file content)."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doc, field, value)
    doc.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(doc)
    return doc


async def delete_document(db: AsyncSession, doc: Document) -> None:
    """Delete a document and its encrypted content."""
    await db.delete(doc)
    await db.commit()


async def toggle_favorite(db: AsyncSession, doc: Document) -> Document:
    """Toggle the favorite flag on a document."""
    doc.is_favorite = not doc.is_favorite
    await db.commit()
    await db.refresh(doc)
    return doc


def decrypt_document(doc: Document, vault_key: bytes) -> bytes:
    """Decrypt and return the raw file bytes."""
    return decrypt_bytes_for_user(vault_key, doc.content_encrypted)


def pages(total: int, limit: int) -> int:
    """Calculate total page count."""
    return math.ceil(total / limit) if limit else 1
