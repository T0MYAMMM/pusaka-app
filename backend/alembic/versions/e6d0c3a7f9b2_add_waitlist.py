"""add waitlist_entries table

Revision ID: e6d0c3a7f9b2
Revises: d5e1b9f3c2a8
Create Date: 2026-03-08 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

revision = "e6d0c3a7f9b2"
down_revision = "d5e1b9f3c2a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Guard: create_all on app startup may have already created this table
    bind = op.get_bind()
    if "waitlist_entries" not in sa_inspect(bind).get_table_names():
        op.create_table(
            "waitlist_entries",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("email", sa.String(255), unique=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("waitlist_entries")
