"""add coding_progress_cache table

Revision ID: 9d8f3b2a1c5f
Revises: 9d8f3b2a1c5e
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "9d8f3b2a1c5f"
down_revision: Union[str, None] = "9d8f3b2a1c5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coding_progress_cache",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("github_username", sa.String(255), nullable=True),
        sa.Column("leetcode_username", sa.String(255), nullable=True),
        sa.Column("github_stats_json", JSONB, nullable=True, server_default="{}"),
        sa.Column("leetcode_stats_json", JSONB, nullable=True, server_default="{}"),
        sa.Column("linkedin_status_json", JSONB, nullable=True, server_default="{}"),
        sa.Column("coding_score", sa.Float, nullable=True, server_default="0.0"),
        sa.Column("placement_readiness_score", sa.Float, nullable=True, server_default="0.0"),
        sa.Column("last_synced_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("coding_progress_cache")
