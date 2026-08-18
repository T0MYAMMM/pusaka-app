"""Business logic for organizations and shared vaults."""

import os
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    decrypt_for_user,
    decrypt_for_vault,
    encrypt_for_vault,
)
from app.models.models import (
    Credential,
    Organization,
    OrganizationMember,
    OrgRole,
    SecureNote,
    SharedCredential,
    SharedNote,
    SharedVault,
    SharedVaultMember,
    User,
)


def _make_invite_token() -> str:
    return os.urandom(32).hex()


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------


async def create_org(db: AsyncSession, owner: User, name: str, slug: str) -> Organization:
    """Create an org and add the owner as the first member (accepted immediately)."""
    org = Organization(name=name, slug=slug, owner_id=owner.id)
    db.add(org)
    await db.flush()  # get org.id

    member = OrganizationMember(
        org_id=org.id,
        user_id=owner.id,
        role=OrgRole.owner,
        invited_email=owner.email,
        invite_accepted_at=datetime.now(UTC),
    )
    db.add(member)
    await db.commit()
    await db.refresh(org)
    return org


async def list_user_orgs(db: AsyncSession, user: User) -> list[Organization]:
    """Return all organizations the user is an accepted member of."""
    result = await db.execute(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.org_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.invite_accepted_at.isnot(None),
        )
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Members
# ---------------------------------------------------------------------------


async def invite_member(
    db: AsyncSession,
    org: Organization,
    email: str,
    role: str,
) -> OrganizationMember:
    """Create a pending invite. If the email belongs to an existing user, link them."""
    # Check not already a member
    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == org.id,
            OrganizationMember.invited_email == email,
        )
    )
    if existing.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="This email is already invited or a member")

    # Try to link to an existing user account
    user_result = await db.execute(select(User).where(User.email == email, User.is_active == True))
    user = user_result.scalar_one_or_none()

    token = _make_invite_token()
    member = OrganizationMember(
        org_id=org.id,
        user_id=user.id if user else None,
        role=role,
        invited_email=email,
        invite_token=token,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def accept_invite(db: AsyncSession, token: str, current_user: User) -> OrganizationMember:
    """Accept a pending invitation. The current user must match the invited email."""
    result = await db.execute(
        select(OrganizationMember).where(OrganizationMember.invite_token == token)
    )
    member = result.scalar_one_or_none()

    if not member or member.invite_accepted_at is not None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid or already-used invite token")

    if member.invited_email != current_user.email:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="This invite was sent to a different email address")

    member.user_id = current_user.id
    member.invite_accepted_at = datetime.now(UTC)
    member.invite_token = None
    await db.commit()
    await db.refresh(member)
    return member


async def list_org_members(db: AsyncSession, org_id: int) -> list[OrganizationMember]:
    result = await db.execute(
        select(OrganizationMember).where(OrganizationMember.org_id == org_id)
    )
    return list(result.scalars().all())


async def remove_member(db: AsyncSession, org: Organization, user_id: int, actor: User) -> None:
    """Remove a member. Owners cannot be removed."""
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == org.id,
            OrganizationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == OrgRole.owner:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="The owner cannot be removed from the organization")

    await db.delete(member)
    await db.commit()


async def update_member_role(
    db: AsyncSession, org: Organization, user_id: int, new_role: str
) -> OrganizationMember:
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == org.id,
            OrganizationMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == OrgRole.owner:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    member.role = new_role
    await db.commit()
    await db.refresh(member)
    return member


# ---------------------------------------------------------------------------
# Shared vaults
# ---------------------------------------------------------------------------


async def create_shared_vault(
    db: AsyncSession, org: Organization, creator: User, name: str, description: str | None
) -> SharedVault:
    vault = SharedVault(org_id=org.id, name=name, description=description, created_by=creator.id)
    db.add(vault)
    await db.commit()
    await db.refresh(vault)
    return vault


async def list_shared_vaults(db: AsyncSession, org_id: int, user: User, is_admin: bool) -> list[SharedVault]:
    """Return vaults the user can see: all if admin/owner, else only those they're a member of."""
    if is_admin:
        result = await db.execute(
            select(SharedVault).where(SharedVault.org_id == org_id)
        )
    else:
        result = await db.execute(
            select(SharedVault)
            .join(SharedVaultMember, SharedVaultMember.vault_id == SharedVault.id)
            .where(
                SharedVault.org_id == org_id,
                SharedVaultMember.user_id == user.id,
            )
        )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Vault members
# ---------------------------------------------------------------------------


async def add_vault_member(
    db: AsyncSession, vault: SharedVault, user_id: int, can_write: bool
) -> SharedVaultMember:
    # Verify user exists and is an org member
    from fastapi import HTTPException
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == vault.org_id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.invite_accepted_at.isnot(None),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is not an accepted member of this organization")

    vm = SharedVaultMember(vault_id=vault.id, user_id=user_id, can_write=can_write)
    db.add(vm)
    await db.commit()
    await db.refresh(vm)
    return vm


async def remove_vault_member(db: AsyncSession, vault: SharedVault, user_id: int) -> None:
    result = await db.execute(
        select(SharedVaultMember).where(
            SharedVaultMember.vault_id == vault.id,
            SharedVaultMember.user_id == user_id,
        )
    )
    vm = result.scalar_one_or_none()
    if not vm:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vault member not found")
    await db.delete(vm)
    await db.commit()


# ---------------------------------------------------------------------------
# Shared credentials
# ---------------------------------------------------------------------------


async def add_credential_to_vault(
    db: AsyncSession,
    vault: SharedVault,
    credential_id: int,
    actor: User,
    user_vault_key: bytes,
) -> SharedCredential:
    """
    Decrypt the credential with the user's personal vault key and re-encrypt
    with the shared vault key so all vault members can read it.
    """
    from fastapi import HTTPException

    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.user_id == actor.id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found or not owned by you")

    password = decrypt_for_user(user_vault_key, cred.password_encrypted)
    secret_key = decrypt_for_user(user_vault_key, cred.secret_key_encrypted) if cred.secret_key_encrypted else None

    sc = SharedCredential(
        vault_id=vault.id,
        credential_id=cred.id,
        label=cred.label,
        type=cred.type,
        website_url=cred.website_url,
        username=cred.username,
        email=cred.email,
        password_encrypted=encrypt_for_vault(vault.id, password),
        secret_key_encrypted=encrypt_for_vault(vault.id, secret_key) if secret_key else None,
        note=cred.note,
        tags=cred.tags,
        added_by=actor.id,
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return sc


async def get_shared_credential(
    db: AsyncSession, vault: SharedVault, shared_cred_id: int
) -> SharedCredential:
    from fastapi import HTTPException
    result = await db.execute(
        select(SharedCredential).where(
            SharedCredential.id == shared_cred_id,
            SharedCredential.vault_id == vault.id,
        )
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Shared credential not found")
    return sc


async def remove_credential_from_vault(
    db: AsyncSession, vault: SharedVault, shared_cred_id: int
) -> None:
    sc = await get_shared_credential(db, vault, shared_cred_id)
    await db.delete(sc)
    await db.commit()


# ---------------------------------------------------------------------------
# Shared notes
# ---------------------------------------------------------------------------


async def add_note_to_vault(
    db: AsyncSession,
    vault: SharedVault,
    note_id: int,
    actor: User,
    user_vault_key: bytes,
) -> SharedNote:
    from fastapi import HTTPException

    result = await db.execute(
        select(SecureNote).where(SecureNote.id == note_id, SecureNote.user_id == actor.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or not owned by you")

    content = decrypt_for_user(user_vault_key, note.content_encrypted)

    sn = SharedNote(
        vault_id=vault.id,
        note_id=note.id,
        title=note.title,
        content_encrypted=encrypt_for_vault(vault.id, content),
        type=note.type,
        tags=note.tags,
        added_by=actor.id,
    )
    db.add(sn)
    await db.commit()
    await db.refresh(sn)
    return sn


async def get_shared_note(
    db: AsyncSession, vault: SharedVault, shared_note_id: int
) -> SharedNote:
    from fastapi import HTTPException
    result = await db.execute(
        select(SharedNote).where(
            SharedNote.id == shared_note_id,
            SharedNote.vault_id == vault.id,
        )
    )
    sn = result.scalar_one_or_none()
    if not sn:
        raise HTTPException(status_code=404, detail="Shared note not found")
    return sn


async def remove_note_from_vault(
    db: AsyncSession, vault: SharedVault, shared_note_id: int
) -> None:
    sn = await get_shared_note(db, vault, shared_note_id)
    await db.delete(sn)
    await db.commit()
