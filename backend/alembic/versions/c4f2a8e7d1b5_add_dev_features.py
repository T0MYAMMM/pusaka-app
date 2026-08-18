"""add_dev_features

Adds env + expires_at to credentials and creates user_api_keys table.

Revision ID: c4f2a8e7d1b5
Revises: b3e9d2f1a4c7
Create Date: 2026-03-08 03:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4f2a8e7d1b5"
down_revision: Union[str, None] = "b3e9d2f1a4c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Credential: env label (default "global") and optional expiry
    op.add_column(
        "credentials",
        sa.Column("env", sa.String(length=20), nullable=False, server_default="global"),
    )
    op.add_column(
        "credentials",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    # API keys table
    op.create_table(
        "user_api_keys",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("key_prefix", sa.String(length=20), nullable=False),
        sa.Column("scope", sa.String(length=10), nullable=False, server_default="read"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
    )
    op.create_index("ix_user_api_keys_id", "user_api_keys", ["id"])
    op.create_index("ix_user_api_keys_key_hash", "user_api_keys", ["key_hash"], unique=True)


def downgrade() -> None:
    op.drop_table("user_api_keys")
    op.drop_column("credentials", "expires_at")
    op.drop_column("credentials", "env")
