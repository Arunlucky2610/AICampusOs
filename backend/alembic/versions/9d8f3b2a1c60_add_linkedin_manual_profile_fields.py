"""add linkedin manual profile fields

Revision ID: 9d8f3b2a1c60
Revises: 9d8f3b2a1c5f
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9d8f3b2a1c60"
down_revision: Union[str, None] = "9d8f3b2a1c5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("students")}
    if "linkedin_headline" not in columns:
        op.add_column("students", sa.Column("linkedin_headline", sa.String(300), nullable=True))
    if "linkedin_about" not in columns:
        op.add_column("students", sa.Column("linkedin_about", sa.Text, nullable=True))
    if "linkedin_skills" not in columns:
        op.add_column("students", sa.Column("linkedin_skills", sa.String(500), nullable=True))
    if "linkedin_open_to_work" not in columns:
        op.add_column("students", sa.Column("linkedin_open_to_work", sa.Integer, nullable=True, server_default="0"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("students")}
    if "linkedin_open_to_work" in columns:
        op.drop_column("students", "linkedin_open_to_work")
    if "linkedin_skills" in columns:
        op.drop_column("students", "linkedin_skills")
    if "linkedin_about" in columns:
        op.drop_column("students", "linkedin_about")
    if "linkedin_headline" in columns:
        op.drop_column("students", "linkedin_headline")
