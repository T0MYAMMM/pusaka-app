from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------


class CredentialCreate(BaseModel):
    label: str
    type: str = "other"
    website_url: str | None = None
    username: str | None = None
    email: str | None = None
    password: str = ""
    secret_key: str | None = None
    note: str | None = None
    is_favorite: bool = False
    tags: str | None = None
    env: str = "global"
    expires_at: datetime | None = None


class CredentialUpdate(BaseModel):
    label: str | None = None
    type: str | None = None
    website_url: str | None = None
    username: str | None = None
    email: str | None = None
    password: str | None = None
    secret_key: str | None = None
    note: str | None = None
    is_favorite: bool | None = None
    tags: str | None = None
    env: str | None = None
    expires_at: datetime | None = None


class CredentialResponse(BaseModel):
    id: int
    label: str
    type: str
    website_url: str | None
    username: str | None
    email: str | None
    # password and secret_key intentionally omitted from list responses
    note: str | None
    is_favorite: bool
    tags: str | None
    env: str
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_accessed: datetime | None

    model_config = {"from_attributes": True}


class CredentialDetailResponse(CredentialResponse):
    """Includes decrypted sensitive fields — only returned on GET /{id}."""
    password: str
    secret_key: str | None


# ---------------------------------------------------------------------------
# Secure Notes
# ---------------------------------------------------------------------------


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    type: str = "personal"
    is_favorite: bool = False
    tags: str | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: str | None = None
    is_favorite: bool | None = None
    tags: str | None = None


class NoteResponse(BaseModel):
    id: int
    title: str
    type: str
    is_favorite: bool
    tags: str | None
    created_at: datetime
    updated_at: datetime
    last_accessed: datetime | None

    model_config = {"from_attributes": True}


class NoteDetailResponse(NoteResponse):
    """Includes decrypted content — only returned on GET /{id}."""
    content: str


# ---------------------------------------------------------------------------
# Activity Log
# ---------------------------------------------------------------------------


class ActivityLogResponse(BaseModel):
    id: int
    action: str
    description: str
    ip_address: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


class CredentialTypeStat(BaseModel):
    type: str
    count: int


class DashboardResponse(BaseModel):
    total_credentials: int
    total_notes: int
    total_documents: int
    favorite_credentials: int
    favorite_notes: int
    recent_credentials: list[CredentialResponse]
    recent_notes: list[NoteResponse]
    recent_activities: list[ActivityLogResponse]
    credential_types: list[CredentialTypeStat]


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


class SearchResponse(BaseModel):
    credentials: list[CredentialResponse]
    notes: list[NoteResponse]
    total_credentials: int
    total_notes: int


# ---------------------------------------------------------------------------
# Pagination wrapper
# ---------------------------------------------------------------------------


class PaginatedCredentials(BaseModel):
    items: list[CredentialResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedNotes(BaseModel):
    items: list[NoteResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedActivity(BaseModel):
    items: list[ActivityLogResponse]
    total: int
    page: int
    limit: int
    pages: int


# ---------------------------------------------------------------------------
# API Keys (Phase 10)
# ---------------------------------------------------------------------------


class APIKeyCreate(BaseModel):
    name: str
    scope: str = "read"

    @field_validator("scope")
    @classmethod
    def valid_scope(cls, v: str) -> str:
        if v not in ("read", "write"):
            raise ValueError("scope must be 'read' or 'write'")
        return v


class APIKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    scope: str
    is_active: bool
    last_used_at: datetime | None
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class APIKeyCreatedResponse(APIKeyResponse):
    """Returned only on creation — includes the full key (shown once)."""
    key: str


# ---------------------------------------------------------------------------
# Duplicate detection (Phase 10)
# ---------------------------------------------------------------------------


class DuplicateGroup(BaseModel):
    credential_ids: list[int]
    label_hints: list[str]  # labels for display without exposing passwords


# ---------------------------------------------------------------------------
# Documents (Phase B)
# ---------------------------------------------------------------------------


class DocumentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    description: str | None
    document_type: str
    file_name: str
    file_size: int
    mime_type: str
    tags: str | None
    expires_at: datetime | None
    is_favorite: bool
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    document_type: str | None = None
    tags: str | None = None
    expires_at: datetime | None = None


class PaginatedDocuments(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    limit: int
    pages: int
