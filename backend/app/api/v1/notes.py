from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_vault_key_dep
from app.models.models import User
from app.schemas.schemas import (
    NoteCreate,
    NoteDetailResponse,
    NoteResponse,
    NoteUpdate,
    PaginatedNotes,
)
from app.services import note_service as svc
from app.services.activity_service import log_activity

router = APIRouter()


@router.get("/", response_model=PaginatedNotes)
async def list_notes(
    q: str | None = Query(default=None),
    favorites_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_notes(
        db, current_user.id, q=q, favorites_only=favorites_only, page=page, limit=limit
    )
    return PaginatedNotes(
        items=items, total=total, page=page, limit=limit, pages=svc.pages(total, limit)
    )


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    note = await svc.create_note(db, current_user.id, payload, vault_key)
    await log_activity(db, current_user.id, "create_note", f"Created note: {note.title}", request)
    return note


@router.get("/{note_id}", response_model=NoteDetailResponse)
async def get_note(
    note_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    note = await svc.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await svc.touch_last_accessed(db, note)
    await log_activity(db, current_user.id, "view_note", f"Viewed note: {note.title}", request)

    content = svc.decrypt_note(note, vault_key)
    base = NoteResponse.model_validate(note)
    return NoteDetailResponse(**base.model_dump(), content=content)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    note = await svc.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    updated = await svc.update_note(db, note, payload, vault_key)
    await log_activity(db, current_user.id, "update_note", f"Updated note: {updated.title}", request)
    return updated


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await svc.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    title = note.title
    await svc.delete_note(db, note)
    await log_activity(db, current_user.id, "delete_note", f"Deleted note: {title}", request)


@router.post("/{note_id}/favorite", response_model=NoteResponse)
async def toggle_favorite(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await svc.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return await svc.toggle_favorite(db, note)
