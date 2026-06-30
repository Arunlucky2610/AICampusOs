"""expand student profile with all fields

Revision ID: 8651d398f7b1
Revises: c6f60534f00c
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "8651d398f7b1"
down_revision: Union[str, None] = "c6f60534f00c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("registration_number", sa.String(40), nullable=True))
    op.add_column("students", sa.Column("course", sa.String(120), nullable=True, server_default="B.Tech"))
    op.add_column("students", sa.Column("branch", sa.String(120), nullable=True))
    op.add_column("students", sa.Column("section", sa.String(10), nullable=True))
    op.add_column("students", sa.Column("semester", sa.Integer, nullable=True))
    op.add_column("students", sa.Column("academic_year", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("date_of_birth", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("gender", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("phone_number", sa.String(20), nullable=True))
    op.add_column("students", sa.Column("address", sa.Text, nullable=True))
    op.add_column("students", sa.Column("current_semester_gpa", sa.Float, nullable=True, server_default="0.0"))
    op.add_column("students", sa.Column("credits_earned", sa.Integer, nullable=True, server_default="0"))
    op.add_column("students", sa.Column("total_credits", sa.Integer, nullable=True, server_default="180"))
    op.add_column("students", sa.Column("faculty_advisor", sa.String(120), nullable=True))
    op.add_column("students", sa.Column("resume_score", sa.Float, nullable=True, server_default="0.0"))
    op.add_column("students", sa.Column("coding_score", sa.Float, nullable=True, server_default="0.0"))
    op.add_column("students", sa.Column("mock_interview_score", sa.Float, nullable=True, server_default="0.0"))
    op.add_column("students", sa.Column("applications", sa.Integer, nullable=True, server_default="0"))
    op.add_column("students", sa.Column("eligible_companies", sa.Integer, nullable=True, server_default="0"))
    op.add_column("students", sa.Column("offers", sa.Integer, nullable=True, server_default="0"))
    op.add_column("students", sa.Column("semester_gpas", JSONB, nullable=True, server_default="[]"))
    op.add_column("students", sa.Column("subjects_data", JSONB, nullable=True, server_default="[]"))
    op.add_column("students", sa.Column("skills_data", JSONB, nullable=True, server_default="{}"))
    op.add_column("students", sa.Column("certifications", JSONB, nullable=True, server_default="[]"))


def downgrade() -> None:
    op.drop_column("students", "certifications")
    op.drop_column("students", "skills_data")
    op.drop_column("students", "subjects_data")
    op.drop_column("students", "semester_gpas")
    op.drop_column("students", "offers")
    op.drop_column("students", "eligible_companies")
    op.drop_column("students", "applications")
    op.drop_column("students", "mock_interview_score")
    op.drop_column("students", "coding_score")
    op.drop_column("students", "resume_score")
    op.drop_column("students", "faculty_advisor")
    op.drop_column("students", "total_credits")
    op.drop_column("students", "credits_earned")
    op.drop_column("students", "current_semester_gpa")
    op.drop_column("students", "address")
    op.drop_column("students", "phone_number")
    op.drop_column("students", "gender")
    op.drop_column("students", "date_of_birth")
    op.drop_column("students", "academic_year")
    op.drop_column("students", "semester")
    op.drop_column("students", "section")
    op.drop_column("students", "branch")
    op.drop_column("students", "course")
    op.drop_column("students", "registration_number")
