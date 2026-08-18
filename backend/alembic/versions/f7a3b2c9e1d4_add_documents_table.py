"""add documents table

Revision ID: f7a3b2c9e1d4
Revises: e6d0c3a7f9b2
Create Date: 2026-03-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

revision = "f7a3b2c9e1d4"
down_revision = "e6d0c3a7f9b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = sa_inspect(bind).get_table_names()
    if "documents" not in existing_tables:
        op.create_table(
            "documents",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("document_type", sa.String(50), nullable=False, server_default="other"),
            sa.Column("file_name", sa.String(500), nullable=False),
            sa.Column("file_size", sa.Integer(), nullable=False),
            sa.Column("mime_type", sa.String(255), nullable=False, server_default="application/octet-stream"),
            sa.Column("content_encrypted", sa.Text(), nullable=False),
            sa.Column("tags", sa.String(500), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_documents_id", "documents", ["id"])
        op.create_index("ix_documents_user_id", "documents", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    existing_tables = sa_inspect(bind).get_table_names()
    if "documents" in existing_tables:
        op.drop_index("ix_documents_user_id", table_name="documents")
        op.drop_index("ix_documents_id", table_name="documents")
        op.drop_table("documents")
