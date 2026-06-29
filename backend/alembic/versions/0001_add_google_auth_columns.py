"""add google auth columns

Revision ID: 0001
Revises:
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("auth_provider", sa.String(20), server_default="password", nullable=False))
    op.add_column("users", sa.Column("google_sub", sa.String(255), nullable=True, unique=True))
    op.add_column("users", sa.Column("profile_picture", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_picture")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "auth_provider")
