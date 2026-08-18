from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_vault_key_dep, require_write_api_key
from app.core.plan_gate import FREE_CREDENTIAL_LIMIT
from app.models.models import User
from app.schemas.schemas import (
    CredentialCreate,
    CredentialDetailResponse,
    CredentialResponse,
    CredentialUpdate,
    DuplicateGroup,
    PaginatedCredentials,
)
from app.services import credential_service as svc
from app.services.activity_service import log_activity

router = APIRouter()


@router.get("/expiring", response_model=list[CredentialResponse])
async def list_expiring_credentials(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List credentials expiring within `days` days (sorted by expiry date, soonest first)."""
    return await svc.list_expiring_credentials(db, current_user.id, days=days)


@router.get("/duplicates", response_model=list[DuplicateGroup])
async def find_duplicates(
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    """Return groups of credentials that share the same password."""
    return await svc.find_duplicate_passwords(db, current_user.id, vault_key)


@router.get("/", response_model=PaginatedCredentials)
async def list_credentials(
    q: str | None = Query(default=None),
    type: str | None = Query(default=None),
    env: str | None = Query(default=None),
    favorites_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_credentials(
        db, current_user.id, q=q, type_filter=type, env_filter=env,
        favorites_only=favorites_only, page=page, limit=limit,
    )
    return PaginatedCredentials(
        items=items, total=total, page=page, limit=limit, pages=svc.pages(total, limit)
    )


@router.post("/", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    payload: CredentialCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    _write: None = Depends(require_write_api_key),
    db: AsyncSession = Depends(get_db),
):
    # Free tier: hard cap at 100 credentials
    if current_user.plan == "free":
        _, total = await svc.list_credentials(db, current_user.id, limit=1)
        if total >= FREE_CREDENTIAL_LIMIT:
            raise HTTPException(
                status_code=402,
                detail=f"Free plan limit reached ({FREE_CREDENTIAL_LIMIT} credentials). Upgrade to Pro for unlimited storage.",
            )

    credential = await svc.create_credential(db, current_user.id, payload, vault_key)
    await log_activity(db, current_user.id, "create_credential", f"Created credential: {credential.label}", request)
    return credential


@router.get("/{credential_id}", response_model=CredentialDetailResponse)
async def get_credential(
    credential_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    credential = await svc.get_credential(db, credential_id, current_user.id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    await svc.touch_last_accessed(db, credential)
    await log_activity(db, current_user.id, "view_credential", f"Viewed credential: {credential.label}", request)

    decrypted = svc.decrypt_credential(credential, vault_key)
    base = CredentialResponse.model_validate(credential)
    return CredentialDetailResponse(**base.model_dump(), **decrypted)


@router.put("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: int,
    payload: CredentialUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    credential = await svc.get_credential(db, credential_id, current_user.id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    updated = await svc.update_credential(db, credential, payload, vault_key)
    await log_activity(db, current_user.id, "update_credential", f"Updated credential: {updated.label}", request)
    return updated


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    credential_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    credential = await svc.get_credential(db, credential_id, current_user.id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")

    label = credential.label
    await svc.delete_credential(db, credential)
    await log_activity(db, current_user.id, "delete_credential", f"Deleted credential: {label}", request)


@router.post("/{credential_id}/favorite", response_model=CredentialResponse)
async def toggle_favorite(
    credential_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    credential = await svc.get_credential(db, credential_id, current_user.id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    return await svc.toggle_favorite(db, credential)
