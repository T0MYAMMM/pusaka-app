import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import ActivityLog, Credential, User
from app.schemas.schemas import (
    DashboardResponse,
    PaginatedActivity,
    SearchResponse,
)
from app.services.activity_service import log_activity
from app.services.dashboard_service import get_dashboard_stats, search_all

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await get_dashboard_stats(db, current_user.id)
    return DashboardResponse(**stats)


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(min_length=1),
    type: str | None = Query(default=None),
    favorites_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    results = await search_all(db, current_user.id, q=q, type_filter=type, favorites_only=favorites_only)
    return SearchResponse(**results)


@router.get("/activity", response_model=PaginatedActivity)
async def activity_log(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.credential_service import pages

    offset = (page - 1) * limit
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    from sqlalchemy import func
    total = await db.scalar(
        select(func.count(ActivityLog.id)).where(ActivityLog.user_id == current_user.id)
    )

    return PaginatedActivity(items=items, total=total or 0, page=page, limit=limit, pages=pages(total or 0, limit))


@router.get("/export")
async def export_csv(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all credentials as CSV — passwords intentionally excluded."""
    result = await db.execute(
        select(Credential)
        .where(Credential.user_id == current_user.id)
        .order_by(Credential.created_at)
    )
    credentials = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["TYPE", "LABEL", "USERNAME", "EMAIL", "WEBSITE", "NOTE", "TAGS", "CREATED"])

    for c in credentials:
        writer.writerow([
            c.type,
            c.label,
            c.username or "",
            c.email or "",
            c.website_url or "",
            c.note or "",
            c.tags or "",
            c.created_at.strftime("%Y-%m-%d") if c.created_at else "",
        ])

    await log_activity(db, current_user.id, "export_data", "Exported credentials as CSV", request)

    filename = f"credentials_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
