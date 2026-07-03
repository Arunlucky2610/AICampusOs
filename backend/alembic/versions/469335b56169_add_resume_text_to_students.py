"""add resume_text column to students

Revision ID: 469335b56169
Revises: 9d8f3b2a1c61
Create Date: 2026-07-02 14:11:55.025872
"""
from alembic import op
import sqlalchemy as sa


revision = "469335b56169"
down_revision = "9d8f3b2a1c61"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.Inspector.from_engine(conn)
    columns = [c["name"] for c in inspector.get_columns("students")]
    if "resume_text" not in columns:
        op.add_column("students", sa.Column("resume_text", sa.Text(), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = sa.Inspector.from_engine(conn)
    columns = [c["name"] for c in inspector.get_columns("students")]
    if "resume_text" in columns:
        op.drop_column("students", "resume_text")
