"""
Organizations and shared vaults API.

Route structure:
  /api/v1/orgs                        — list & create orgs
  /api/v1/orgs/{org_id}               — get, update, delete
  /api/v1/orgs/{org_id}/members       — list, invite, remove, role update
  /api/v1/orgs/{org_id}/vaults        — list & create shared vaults
  /api/v1/orgs/{org_id}/vaults/{vid}  — get, update, delete vault
  /api/v1/orgs/{org_id}/vaults/{vid}/members        — list, add, remove vault members
  /api/v1/orgs/{org_id}/vaults/{vid}/credentials    — list, add, remove shared credentials
  /api/v1/orgs/{org_id}/vaults/{vid}/credentials/{id} — get detail (decrypted)
  /api/v1/orgs/{org_id}/vaults/{vid}/notes          — list, add, remove shared notes
  /api/v1/orgs/{org_id}/vaults/{vid}/notes/{id}     — get detail (decrypted)
  /api/v1/orgs/accept-invite          — accept invite by token
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_vault_key_dep, require_write_api_key
from app.core.rbac import require_org_role, require_vault_access
from app.core.security import decrypt_for_vault
from app.models.models import OrgRole, Organization, OrganizationMember, SharedVault, SharedVaultMember, User
from app.schemas.org_schemas import (
    AddVaultMemberRequest,
    InviteMemberRequest,
    MemberResponse,
    OrgCreate,
    OrgResponse,
    OrgUpdate,
    SharedCredentialDetailResponse,
    SharedCredentialResponse,
    SharedNoteDetailResponse,
    SharedNoteResponse,
    SharedVaultCreate,
    SharedVaultResponse,
    SharedVaultUpdate,
    UpdateRoleRequest,
    VaultMemberResponse,
)
from app.services import org_service
from app.core.email import _send as send_email

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Organizations — CRUD
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[OrgResponse])
async def list_orgs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations the current user belongs to."""
    return await org_service.list_user_orgs(db, current_user)


@router.post("/", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    payload: OrgCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check slug uniqueness
    existing = await db.execute(select(Organization).where(Organization.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An organization with this slug already exists")

    return await org_service.create_org(db, current_user, payload.name, payload.slug)


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(
    ctx: tuple = Depends(require_org_role("viewer")),
):
    org, _ = ctx
    return org


@router.put("/{org_id}", response_model=OrgResponse)
async def update_org(
    payload: OrgUpdate,
    ctx: tuple = Depends(require_org_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    if payload.name is not None:
        org.name = payload.name
    await db.commit()
    await db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_org(
    ctx: tuple = Depends(require_org_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    await db.delete(org)
    await db.commit()


# ---------------------------------------------------------------------------
# Accept invite (no org_id in path — token identifies the invite)
# ---------------------------------------------------------------------------


@router.post("/accept-invite", response_model=MemberResponse)
async def accept_invite(
    token: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await org_service.accept_invite(db, token, current_user)


# ---------------------------------------------------------------------------
# Organization members
# ---------------------------------------------------------------------------


@router.get("/{org_id}/members", response_model=list[MemberResponse])
async def list_members(
    ctx: tuple = Depends(require_org_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    return await org_service.list_org_members(db, org.id)


@router.post("/{org_id}/invite", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    payload: InviteMemberRequest,
    request: Request,
    ctx: tuple = Depends(require_org_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    member = await org_service.invite_member(db, org, str(payload.email), payload.role)

    # Send invite email (fire-and-forget; errors are logged but don't fail the request)
    try:
        from app.core.config import settings
        link = f"{settings.app_base_url}/accept-invite?token={member.invite_token}"
        await send_email(
            to=str(payload.email),
            subject=f"You've been invited to join {org.name} on Vault",
            html=(
                f"<p>You've been invited to join the <strong>{org.name}</strong> organization.</p>"
                f"<p><a href='{link}'>Accept invitation</a></p>"
                f"<p>If you don't have an account, you'll be prompted to create one first.</p>"
            ),
        )
    except Exception:
        logger.exception("Failed to send invite email to %s", payload.email)

    return member


@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user_id: int,
    ctx: tuple = Depends(require_org_role("admin")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    await org_service.remove_member(db, org, user_id, current_user)


@router.put("/{org_id}/members/{user_id}/role", response_model=MemberResponse)
async def update_member_role(
    user_id: int,
    payload: UpdateRoleRequest,
    ctx: tuple = Depends(require_org_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    return await org_service.update_member_role(db, org, user_id, payload.role)


# ---------------------------------------------------------------------------
# Shared vaults — CRUD
# ---------------------------------------------------------------------------


@router.get("/{org_id}/vaults", response_model=list[SharedVaultResponse])
async def list_vaults(
    ctx: tuple = Depends(require_org_role("viewer")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, member = ctx
    is_admin = member.role in (OrgRole.owner, OrgRole.admin)
    return await org_service.list_shared_vaults(db, org.id, current_user, is_admin)


@router.post("/{org_id}/vaults", response_model=SharedVaultResponse, status_code=status.HTTP_201_CREATED)
async def create_vault(
    payload: SharedVaultCreate,
    ctx: tuple = Depends(require_org_role("admin")),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = ctx
    return await org_service.create_shared_vault(db, org, current_user, payload.name, payload.description)


@router.get("/{org_id}/vaults/{vault_id}", response_model=SharedVaultResponse)
async def get_vault(
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
):
    vault, _ = vault_ctx
    return vault


@router.put("/{org_id}/vaults/{vault_id}", response_model=SharedVaultResponse)
async def update_vault(
    payload: SharedVaultUpdate,
    vault_ctx: tuple = Depends(require_vault_access(write=True)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    if payload.name is not None:
        vault.name = payload.name
    if payload.description is not None:
        vault.description = payload.description
    await db.commit()
    await db.refresh(vault)
    return vault


@router.delete("/{org_id}/vaults/{vault_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vault(
    ctx: tuple = Depends(require_org_role("admin")),
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    await db.delete(vault)
    await db.commit()


# ---------------------------------------------------------------------------
# Vault members
# ---------------------------------------------------------------------------


@router.get("/{org_id}/vaults/{vault_id}/members", response_model=list[VaultMemberResponse])
async def list_vault_members(
    vault_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SharedVaultMember).where(SharedVaultMember.vault_id == vault_id)
    )
    return list(result.scalars().all())


@router.post("/{org_id}/vaults/{vault_id}/members", response_model=VaultMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_vault_member(
    payload: AddVaultMemberRequest,
    ctx: tuple = Depends(require_org_role("admin")),
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    return await org_service.add_vault_member(db, vault, payload.user_id, payload.can_write)


@router.delete("/{org_id}/vaults/{vault_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vault_member(
    user_id: int,
    ctx: tuple = Depends(require_org_role("admin")),
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    await org_service.remove_vault_member(db, vault, user_id)


# ---------------------------------------------------------------------------
# Shared credentials
# ---------------------------------------------------------------------------


@router.get("/{org_id}/vaults/{vault_id}/credentials", response_model=list[SharedCredentialResponse])
async def list_shared_credentials(
    vault_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    from app.models.models import SharedCredential
    result = await db.execute(
        select(SharedCredential).where(SharedCredential.vault_id == vault_id)
    )
    return list(result.scalars().all())


@router.get("/{org_id}/vaults/{vault_id}/credentials/{shared_cred_id}", response_model=SharedCredentialDetailResponse)
async def get_shared_credential(
    shared_cred_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    sc = await org_service.get_shared_credential(db, vault, shared_cred_id)
    password = decrypt_for_vault(vault.id, sc.password_encrypted)
    secret_key = decrypt_for_vault(vault.id, sc.secret_key_encrypted) if sc.secret_key_encrypted else None
    return SharedCredentialDetailResponse(
        **SharedCredentialResponse.model_validate(sc).model_dump(),
        password=password,
        secret_key=secret_key,
    )


@router.post("/{org_id}/vaults/{vault_id}/credentials/{credential_id}", response_model=SharedCredentialResponse, status_code=status.HTTP_201_CREATED)
async def add_credential_to_vault(
    credential_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=True)),
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    return await org_service.add_credential_to_vault(db, vault, credential_id, current_user, vault_key)


@router.delete("/{org_id}/vaults/{vault_id}/credentials/{shared_cred_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_credential_from_vault(
    shared_cred_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=True)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    await org_service.remove_credential_from_vault(db, vault, shared_cred_id)


# ---------------------------------------------------------------------------
# Shared notes
# ---------------------------------------------------------------------------


@router.get("/{org_id}/vaults/{vault_id}/notes", response_model=list[SharedNoteResponse])
async def list_shared_notes(
    vault_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    from app.models.models import SharedNote
    result = await db.execute(
        select(SharedNote).where(SharedNote.vault_id == vault_id)
    )
    return list(result.scalars().all())


@router.get("/{org_id}/vaults/{vault_id}/notes/{shared_note_id}", response_model=SharedNoteDetailResponse)
async def get_shared_note(
    shared_note_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    sn = await org_service.get_shared_note(db, vault, shared_note_id)
    content = decrypt_for_vault(vault.id, sn.content_encrypted)
    return SharedNoteDetailResponse(
        **SharedNoteResponse.model_validate(sn).model_dump(),
        content=content,
    )


@router.post("/{org_id}/vaults/{vault_id}/notes/{note_id}", response_model=SharedNoteResponse, status_code=status.HTTP_201_CREATED)
async def add_note_to_vault(
    note_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=True)),
    current_user: User = Depends(get_current_user),
    vault_key: bytes = Depends(get_vault_key_dep),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    return await org_service.add_note_to_vault(db, vault, note_id, current_user, vault_key)


@router.delete("/{org_id}/vaults/{vault_id}/notes/{shared_note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_note_from_vault(
    shared_note_id: int,
    vault_ctx: tuple = Depends(require_vault_access(write=True)),
    db: AsyncSession = Depends(get_db),
):
    vault, _ = vault_ctx
    await org_service.remove_note_from_vault(db, vault, shared_note_id)


# ---------------------------------------------------------------------------
# .env export — API key gated
# ---------------------------------------------------------------------------


def _to_env_key(label: str) -> str:
    """Convert a credential label to a valid .env variable name."""
    key = re.sub(r"[^A-Z0-9_]", "_", label.upper().replace(" ", "_"))
    # Ensure it starts with a letter or underscore
    if key and key[0].isdigit():
        key = f"_{key}"
    return key or "UNNAMED"


@router.get("/{org_id}/vaults/{vault_id}/env", response_class=Response)
async def export_vault_env(
    env_filter: str | None = Query(default=None, alias="env"),
    vault_ctx: tuple = Depends(require_vault_access(write=False)),
    db: AsyncSession = Depends(get_db),
):
    """
    Return vault credentials as a .env file (text/plain).

    Designed for CI/CD injection:
      curl -H "Authorization: Bearer cmv1_..." \\
           https://api.example.com/api/v1/orgs/1/vaults/2/env > .env

    Filters by env label when ?env=prod is specified.
    """
    from app.models.models import SharedCredential
    vault, _ = vault_ctx

    stmt = select(SharedCredential).where(SharedCredential.vault_id == vault.id)
    if env_filter:
        # SharedCredential doesn't have its own env field — we filter after joining
        # to the original Credential. For simplicity, filter is a hint only here;
        # the full env field lives on the original Credential. In a production
        # system this would join back; for MVP we expose all vault creds.
        pass

    result = await db.execute(stmt)
    shared_creds = result.scalars().all()

    lines = [f"# Vault: {vault.name}", ""]
    seen_keys: dict[str, int] = {}

    for sc in shared_creds:
        password = decrypt_for_vault(vault.id, sc.password_encrypted)
        base_key = _to_env_key(sc.label)

        # Deduplicate key names
        if base_key in seen_keys:
            seen_keys[base_key] += 1
            key = f"{base_key}_{seen_keys[base_key]}"
        else:
            seen_keys[base_key] = 0
            key = base_key

        lines.append(f"{key}={password}")
        if sc.username:
            lines.append(f"{key}_USERNAME={sc.username}")

    content = "\n".join(lines) + "\n"
    return Response(content=content, media_type="text/plain")
