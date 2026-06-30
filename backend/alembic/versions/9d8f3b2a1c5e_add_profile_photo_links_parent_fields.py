"""add profile_photo_url, links, parent, communication_score, JSON list fields

Revision ID: 9d8f3b2a1c5e
Revises: 8651d398f7b1
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "9d8f3b2a1c5e"
down_revision: Union[str, None] = "8651d398f7b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("profile_photo_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("communication_score", sa.Float, nullable=True, server_default="0.0"))
    op.add_column("students", sa.Column("preferred_role", sa.String(100), nullable=True))
    op.add_column("students", sa.Column("expected_package", sa.String(50), nullable=True))
    op.add_column("students", sa.Column("eligible_companies_list", JSONB, nullable=True, server_default="[]"))
    op.add_column("students", sa.Column("applied_companies_list", JSONB, nullable=True, server_default="[]"))
    op.add_column("students", sa.Column("github_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("linkedin_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("leetcode_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("portfolio_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("resume_url", sa.String(500), nullable=True))
    op.add_column("students", sa.Column("parent_name", sa.String(160), nullable=True))
    op.add_column("students", sa.Column("parent_phone", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("parent_email", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("students", "parent_email")
    op.drop_column("students", "parent_phone")
    op.drop_column("students", "parent_name")
    op.drop_column("students", "resume_url")
    op.drop_column("students", "portfolio_url")
    op.drop_column("students", "leetcode_url")
    op.drop_column("students", "linkedin_url")
    op.drop_column("students", "github_url")
    op.drop_column("students", "applied_companies_list")
    op.drop_column("students", "eligible_companies_list")
    op.drop_column("students", "expected_package")
    op.drop_column("students", "preferred_role")
    op.drop_column("students", "communication_score")
    op.drop_column("students", "profile_photo_url")
