"""add billing fields to users

Revision ID: d5e1b9f3c2a8
Revises: c4f2a8e7d1b5
Create Date: 2026-03-08 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

revision = "d5e1b9f3c2a8"
down_revision = "c4f2a8e7d1b5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c["name"] for c in sa_inspect(bind).get_columns("users")}
    if "plan" not in existing_cols:
        op.add_column("users", sa.Column("plan", sa.String(20), nullable=False, server_default="free"))
    if "stripe_customer_id" not in existing_cols:
        op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "plan")
