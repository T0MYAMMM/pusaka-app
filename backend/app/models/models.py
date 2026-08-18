from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CredentialType(str, Enum):
    website = "website"
    email = "email"
    social = "social"
    banking = "banking"
    work = "work"
    personal = "personal"
    game = "game"
    server = "server"
    api = "api"
    other = "other"


class CredentialEnv(str, Enum):
    dev = "dev"
    staging = "staging"
    prod = "prod"
    global_ = "global"  # "global" reserved keyword in some contexts — mapped to "global" in DB


class APIKeyScope(str, Enum):
    read = "read"
    write = "write"


class NoteType(str, Enum):
    personal = "personal"
    work = "work"
    financial = "financial"
    medical = "medical"
    legal = "legal"
    technical = "technical"
    other = "other"


class DocumentType(str, Enum):
    identity = "identity"         # KTP, paspor, SIM
    certificate = "certificate"   # ijazah, akta lahir, sertifikat
    financial = "financial"       # rekening, asuransi, kontrak
    medical = "medical"           # rekam medis, BPJS
    legal = "legal"               # surat tanah, akta notaris
    insurance = "insurance"       # polis asuransi
    travel = "travel"             # tiket, visa, itinerary
    other = "other"


class ActivityAction(str, Enum):
    login = "login"
    logout = "logout"
    register = "register"
    create_credential = "create_credential"
    view_credential = "view_credential"
    update_credential = "update_credential"
    delete_credential = "delete_credential"
    create_note = "create_note"
    view_note = "view_note"
    update_note = "update_note"
    delete_note = "delete_note"
    export_data = "export_data"
    create_document = "create_document"
    view_document = "view_document"
    update_document = "update_document"
    delete_document = "delete_document"
    download_document = "download_document"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    last_name: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Per-user vault encryption (Phase 7)
    vault_salt: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    vault_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    vault_key_recovery_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Email verification (Phase 8)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verification_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email_verification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Password reset (Phase 8)
    password_reset_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Billing (Phase 11)
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    credentials: Mapped[list["Credential"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    secure_notes: Mapped[list["SecureNote"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    label: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default=CredentialType.other)
    website_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    secret_key_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Phase 10 — developer features
    env: Mapped[str] = mapped_column(String(20), nullable=False, default="global")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_accessed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="credentials")


class SecureNote(Base):
    __tablename__ = "secure_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    type: Mapped[str] = mapped_column(String(50), nullable=False, default=NoteType.personal)

    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_accessed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="secure_notes")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False, default=DocumentType.other)

    # File metadata (stored unencrypted for display without vault key)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False, default="application/octet-stream")

    # Encrypted file content (Fernet base64)
    content_encrypted: Mapped[str] = mapped_column(Text, nullable=False)

    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="documents")


# ---------------------------------------------------------------------------
# Phase 9 — Teams & Organizations
# ---------------------------------------------------------------------------


class OrgPlan(str, Enum):
    free = "free"
    pro = "pro"
    team = "team"
    team_growth = "team_growth"


class OrgRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(20), nullable=False, default=OrgPlan.free)

    # Stripe — populated when billing is set up (Phase 11)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    shared_vaults: Mapped[list["SharedVault"]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("org_id", "user_id", name="uq_org_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    # user_id is NULL while invite is pending (user not yet registered)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=OrgRole.member)

    invited_email: Mapped[str] = mapped_column(String(255), nullable=False)
    invite_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    invite_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship(back_populates="members")
    user: Mapped["User | None"] = relationship()


class SharedVault(Base):
    __tablename__ = "shared_vaults"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship(back_populates="shared_vaults")
    vault_members: Mapped[list["SharedVaultMember"]] = relationship(back_populates="vault", cascade="all, delete-orphan")
    shared_credentials: Mapped[list["SharedCredential"]] = relationship(back_populates="vault", cascade="all, delete-orphan")
    shared_notes: Mapped[list["SharedNote"]] = relationship(back_populates="vault", cascade="all, delete-orphan")


class SharedVaultMember(Base):
    __tablename__ = "shared_vault_members"
    __table_args__ = (UniqueConstraint("vault_id", "user_id", name="uq_vault_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vault_id: Mapped[int] = mapped_column(Integer, ForeignKey("shared_vaults.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    can_write: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vault: Mapped["SharedVault"] = relationship(back_populates="vault_members")
    user: Mapped["User"] = relationship()


class SharedCredential(Base):
    """
    A credential shared into a vault.

    Sensitive fields (password, secret_key) are re-encrypted with the shared
    vault key (HMAC-SHA256(SECRET_KEY, "vault:{id}")) so all vault members
    can decrypt them regardless of who originally added the item.
    The original credential_id is kept for reference (e.g. UI deduplication).
    """
    __tablename__ = "shared_credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vault_id: Mapped[int] = mapped_column(Integer, ForeignKey("shared_vaults.id", ondelete="CASCADE"), nullable=False)
    # The original personal credential (kept for reference; not a hard constraint so items survive
    # even if the original is deleted)
    credential_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("credentials.id", ondelete="SET NULL"), nullable=True)

    label: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="other")
    website_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Re-encrypted with the shared vault key
    password_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    secret_key_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)

    added_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vault: Mapped["SharedVault"] = relationship(back_populates="shared_credentials")


class SharedNote(Base):
    """A secure note shared into a vault, re-encrypted with the shared vault key."""
    __tablename__ = "shared_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vault_id: Mapped[int] = mapped_column(Integer, ForeignKey("shared_vaults.id", ondelete="CASCADE"), nullable=False)
    note_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("secure_notes.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_encrypted: Mapped[str] = mapped_column(Text, nullable=False, default="")
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="personal")
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)

    added_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vault: Mapped["SharedVault"] = relationship(back_populates="shared_notes")


class UserAPIKey(Base):
    """
    Machine-auth API key for CLI and CI/CD access.

    Key format: cmv1_<64-hex-chars>  (total 69 chars)
    Only the SHA-256 hash is stored. The full key is shown to the user once.
    """
    __tablename__ = "user_api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)  # SHA-256 hex
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)  # "cmv1_xxxxxxxx" for display
    scope: Mapped[str] = mapped_column(String(10), nullable=False, default=APIKeyScope.read)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()


class WaitlistEntry(Base):
    """Email addresses collected from the landing page waitlist form."""
    __tablename__ = "waitlist_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    action: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="activity_logs")
