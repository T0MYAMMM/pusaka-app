"""add_auth_hardening_fields

Revision ID: a2f8c1d4e3b9
Revises: 14bba3c95e51
Create Date: 2026-03-08 01:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a2f8c1d4e3b9"
down_revision: Union[str, None] = "14bba3c95e51"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # vault_key_recovery_encrypted — NOT NULL; existing rows get ''
    op.add_column(
        "users",
        sa.Column("vault_key_recovery_encrypted", sa.Text(), nullable=False, server_default=""),
    )
    # Email verification
    op.add_column(
        "users",
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("users", sa.Column("email_verification_token", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("email_verification_sent_at", sa.DateTime(timezone=True), nullable=True))
    # Password reset
    op.add_column("users", sa.Column("password_reset_token", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token")
    op.drop_column("users", "email_verification_sent_at")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "is_email_verified")
    op.drop_column("users", "vault_key_recovery_encrypted")
