"""Pydantic schemas for organizations, shared vaults, and related models."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------


class OrgCreate(BaseModel):
    name: str
    slug: str

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Slug may only contain letters, numbers, hyphens, and underscores")
        return v.lower()


class OrgUpdate(BaseModel):
    name: str | None = None


class OrgResponse(BaseModel):
    id: int
    name: str
    slug: str
    plan: str
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Organization members
# ---------------------------------------------------------------------------


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "member"

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("admin", "member", "viewer"):
            raise ValueError("Role must be admin, member, or viewer")
        return v


class UpdateRoleRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("admin", "member", "viewer"):
            raise ValueError("Role must be admin, member, or viewer")
        return v


class MemberResponse(BaseModel):
    id: int
    user_id: int | None
    role: str
    invited_email: str
    invite_accepted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Shared vaults
# ---------------------------------------------------------------------------


class SharedVaultCreate(BaseModel):
    name: str
    description: str | None = None


class SharedVaultUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class SharedVaultResponse(BaseModel):
    id: int
    org_id: int
    name: str
    description: str | None
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VaultMemberResponse(BaseModel):
    id: int
    user_id: int
    can_write: bool
    added_at: datetime

    model_config = {"from_attributes": True}


class AddVaultMemberRequest(BaseModel):
    user_id: int
    can_write: bool = False


# ---------------------------------------------------------------------------
# Shared credentials
# ---------------------------------------------------------------------------


class SharedCredentialResponse(BaseModel):
    id: int
    vault_id: int
    credential_id: int | None
    label: str
    type: str
    website_url: str | None
    username: str | None
    email: str | None
    note: str | None
    tags: str | None
    added_by: int
    added_at: datetime

    model_config = {"from_attributes": True}


class SharedCredentialDetailResponse(SharedCredentialResponse):
    """Includes decrypted sensitive fields — returned on GET /{id}."""
    password: str
    secret_key: str | None


# ---------------------------------------------------------------------------
# Shared notes
# ---------------------------------------------------------------------------


class SharedNoteResponse(BaseModel):
    id: int
    vault_id: int
    note_id: int | None
    title: str
    type: str
    tags: str | None
    added_by: int
    added_at: datetime

    model_config = {"from_attributes": True}


class SharedNoteDetailResponse(SharedNoteResponse):
    """Includes decrypted content."""
    content: str
