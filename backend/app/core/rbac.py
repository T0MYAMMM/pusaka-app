"""
RBAC (Role-Based Access Control) dependencies for org and vault endpoints.

Role hierarchy (highest to lowest):
  owner  → all actions, including billing, delete org, promote/demote members
  admin  → manage members, create/delete vaults, add/remove items from vaults
  member → read/write their own credentials; read vaults they belong to
  viewer → read-only on vaults they belong to
"""

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import OrgRole, Organization, OrganizationMember, SharedVault, SharedVaultMember, User

# Role ordering for comparison (higher index = more permissions)
_ROLE_RANK = {OrgRole.viewer: 0, OrgRole.member: 1, OrgRole.admin: 2, OrgRole.owner: 3}


def _role_gte(role: str, minimum: str) -> bool:
    """Return True if role has at least the permissions of minimum."""
    return _ROLE_RANK.get(role, -1) >= _ROLE_RANK.get(minimum, 99)


async def _get_org_member(
    org_id: int,
    current_user: User,
    db: AsyncSession,
) -> OrganizationMember:
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == org_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.invite_accepted_at.isnot(None),
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=403, detail="You are not a member of this organization")
    return member


def require_org_role(minimum_role: str):
    """
    FastAPI dependency factory — injects (org, member) after checking the user
    has at least `minimum_role` in the given organization.

    Usage::

        @router.get("/{org_id}/something")
        async def endpoint(
            org_id: int,
            ctx: tuple[Organization, OrganizationMember] = Depends(require_org_role("admin")),
        ):
            org, member = ctx
    """
    async def _dep(
        org_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> tuple[Organization, OrganizationMember]:
        # Load org
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()
        if org is None:
            raise HTTPException(status_code=404, detail="Organization not found")

        member = await _get_org_member(org_id, current_user, db)

        if not _role_gte(member.role, minimum_role):
            raise HTTPException(
                status_code=403,
                detail=f"This action requires {minimum_role} role or higher",
            )
        return org, member

    return _dep


def require_vault_access(write: bool = False):
    """
    Dependency factory for shared vault access.

    Checks that the current user is:
    - An accepted org member
    - A member of the specific vault (or has admin/owner org role)
    - Has write permission if write=True

    Injects (vault, member_or_none) where member_or_none is the vault-level
    membership record (None if org admin/owner bypassing vault membership).
    """
    async def _dep(
        org_id: int,
        vault_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> tuple[SharedVault, SharedVaultMember | None]:
        # Load org membership
        org_member = await _get_org_member(org_id, current_user, db)

        # Load vault and verify it belongs to this org
        result = await db.execute(
            select(SharedVault).where(
                SharedVault.id == vault_id,
                SharedVault.org_id == org_id,
            )
        )
        vault = result.scalar_one_or_none()
        if vault is None:
            raise HTTPException(status_code=404, detail="Shared vault not found")

        # Org owner and admin bypass vault-level membership checks
        if _role_gte(org_member.role, OrgRole.admin):
            return vault, None

        # Check vault-level membership
        result = await db.execute(
            select(SharedVaultMember).where(
                SharedVaultMember.vault_id == vault_id,
                SharedVaultMember.user_id == current_user.id,
            )
        )
        vault_member = result.scalar_one_or_none()
        if vault_member is None:
            raise HTTPException(status_code=403, detail="You do not have access to this vault")

        if write and not vault_member.can_write:
            raise HTTPException(status_code=403, detail="Write access required for this vault")

        return vault, vault_member

    return _dep
