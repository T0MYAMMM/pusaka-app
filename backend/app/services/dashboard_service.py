"""Dashboard and search business logic."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ActivityLog, Credential, Document, SecureNote


async def get_dashboard_stats(db: AsyncSession, user_id: int) -> dict:
    total_creds = await db.scalar(
        select(func.count(Credential.id)).where(Credential.user_id == user_id)
    )
    total_notes = await db.scalar(
        select(func.count(SecureNote.id)).where(SecureNote.user_id == user_id)
    )
    total_docs = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == user_id)
    )
    fav_creds = await db.scalar(
        select(func.count(Credential.id)).where(
            Credential.user_id == user_id, Credential.is_favorite == True  # noqa: E712
        )
    )
    fav_notes = await db.scalar(
        select(func.count(SecureNote.id)).where(
            SecureNote.user_id == user_id, SecureNote.is_favorite == True  # noqa: E712
        )
    )

    recent_creds_result = await db.execute(
        select(Credential)
        .where(Credential.user_id == user_id)
        .order_by(Credential.updated_at.desc())
        .limit(5)
    )
    recent_creds = recent_creds_result.scalars().all()

    recent_notes_result = await db.execute(
        select(SecureNote)
        .where(SecureNote.user_id == user_id)
        .order_by(SecureNote.updated_at.desc())
        .limit(5)
    )
    recent_notes = recent_notes_result.scalars().all()

    recent_activity_result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(5)
    )
    recent_activities = recent_activity_result.scalars().all()

    cred_types_result = await db.execute(
        select(Credential.type, func.count(Credential.id).label("count"))
        .where(Credential.user_id == user_id)
        .group_by(Credential.type)
        .order_by(func.count(Credential.id).desc())
        .limit(5)
    )
    credential_types = [{"type": row.type, "count": row.count} for row in cred_types_result]

    return {
        "total_credentials": total_creds or 0,
        "total_notes": total_notes or 0,
        "total_documents": total_docs or 0,
        "favorite_credentials": fav_creds or 0,
        "favorite_notes": fav_notes or 0,
        "recent_credentials": recent_creds,
        "recent_notes": recent_notes,
        "recent_activities": recent_activities,
        "credential_types": credential_types,
    }


async def search_all(
    db: AsyncSession,
    user_id: int,
    q: str,
    type_filter: str | None = None,
    favorites_only: bool = False,
) -> dict:
    from app.services.credential_service import list_credentials
    from app.services.note_service import list_notes

    creds, total_creds = await list_credentials(
        db, user_id, q=q, type_filter=type_filter, favorites_only=favorites_only, limit=50
    )
    notes, total_notes = await list_notes(
        db, user_id, q=q, favorites_only=favorites_only, limit=50
    )

    return {
        "credentials": creds,
        "notes": notes,
        "total_credentials": total_creds,
        "total_notes": total_notes,
    }
