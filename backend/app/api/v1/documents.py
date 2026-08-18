"""Documents API — encrypted file storage."""

from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_vault_key_dep
from app.models.models import User
from app.schemas.schemas import DocumentResponse, DocumentUpdate, PaginatedDocuments
from app.services import document_service as svc
from app.services.activity_service import log_activity

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.get("/", response_model=PaginatedDocuments)
async def list_documents(
    q: str | None = Query(default=None),
    type_filter: str | None = Query(default=None),
    favorites_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_documents(
        db,
        current_user.id,
        q=q,
        type_filter=type_filter,
        favorites_only=favorites_only,
        page=page,
        limit=limit,
    )
    return PaginatedDocuments(
        items=items, total=total, page=page, limit=limit, pages=svc.pages(total, limit)
    )


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile,
    title: str = Form(...),
    document_type: str = Form(default="other"),
    description: str | None = Form(default=None),
    tags: str | None = Form(default=None),
    expires_at: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 25 MB limit",
        )

    expires_dt: datetime | None = None
    if expires_at:
        try:
            expires_dt = datetime.fromisoformat(expires_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expires_at format")

    doc = await svc.create_document(
        db,
        user_id=current_user.id,
        title=title,
        description=description,
        document_type=document_type,
        file_name=file.filename or "untitled",
        file_size=len(file_bytes),
        mime_type=file.content_type or "application/octet-stream",
        tags=tags,
        expires_at=expires_dt,
        file_bytes=file_bytes,
        vault_key=vault_key,
    )
    await log_activity(
        db, current_user.id, "create_document", f"Uploaded document: {doc.title}", request
    )
    return doc


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await svc.get_document(db, document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await log_activity(
        db, current_user.id, "view_document", f"Viewed document: {doc.title}", request
    )
    return doc


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    doc = await svc.get_document(db, document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_bytes = svc.decrypt_document(doc, vault_key)
    await log_activity(
        db, current_user.id, "download_document", f"Downloaded document: {doc.title}", request
    )
    return Response(
        content=file_bytes,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
    )


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    payload: DocumentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await svc.get_document(db, document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    updated = await svc.update_document(db, doc, payload)
    await log_activity(
        db, current_user.id, "update_document", f"Updated document: {updated.title}", request
    )
    return updated


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await svc.get_document(db, document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    title = doc.title
    await svc.delete_document(db, doc)
    await log_activity(
        db, current_user.id, "delete_document", f"Deleted document: {title}", request
    )


@router.post("/{document_id}/favorite", response_model=DocumentResponse)
async def toggle_favorite(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await svc.get_document(db, document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return await svc.toggle_favorite(db, doc)
