"""Activity logging service."""

import logging

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import ActivityLog

logger = logging.getLogger(__name__)


async def log_activity(
    db: AsyncSession,
    user_id: int,
    action: str,
    description: str,
    request: Request | None = None,
) -> None:
    """Write an activity log entry. Silently skips if logging is disabled."""
    if not settings.enable_activity_logging:
        return
    try:
        ip = None
        ua = None
        if request:
            forwarded = request.headers.get("X-Forwarded-For")
            ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else None
            ua = request.headers.get("User-Agent")

        entry = ActivityLog(
            user_id=user_id,
            action=action,
            description=description,
            ip_address=ip,
            user_agent=ua,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        logger.exception("Failed to write activity log")
