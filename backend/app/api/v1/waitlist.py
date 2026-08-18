"""Waitlist endpoint — collect emails from the landing page."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import WaitlistEntry

logger = logging.getLogger(__name__)
router = APIRouter()


class WaitlistRequest(BaseModel):
    email: EmailStr


class WaitlistResponse(BaseModel):
    detail: str


@router.post("/", response_model=WaitlistResponse, status_code=201)
async def join_waitlist(
    body: WaitlistRequest,
    db: AsyncSession = Depends(get_db),
):
    """Add an email to the launch waitlist. Idempotent — duplicate emails return 200."""
    result = await db.execute(select(WaitlistEntry).where(WaitlistEntry.email == body.email))
    existing = result.scalar_one_or_none()
    if existing:
        return WaitlistResponse(detail="You're already on the waitlist!")

    entry = WaitlistEntry(email=body.email)
    db.add(entry)
    await db.commit()
    logger.info("Waitlist signup: %s", body.email)
    return WaitlistResponse(detail="You're on the list! We'll be in touch.")
