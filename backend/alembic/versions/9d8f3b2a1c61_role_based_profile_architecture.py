"""add role-based profile tables (faculty, placement, parent, student_profiles, predictions, skills, roadmaps, notifications)

Revision ID: 9d8f3b2a1c61
Revises: 9d8f3b2a1c60
Create Date: 2026-06-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "9d8f3b2a1c61"
down_revision: Union[str, None] = "9d8f3b2a1c60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("faculty_profiles"):
        op.create_table(
            "faculty_profiles",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
            sa.Column("employee_id", sa.String(40), nullable=True),
            sa.Column("department", sa.String(120), nullable=False),
            sa.Column("designation", sa.String(120), nullable=False),
            sa.Column("phone", sa.String(20), nullable=True),
            sa.Column("subject_handling", JSONB, nullable=True, server_default="[]"),
            sa.Column("assigned_years", JSONB, nullable=True, server_default="[]"),
            sa.Column("assigned_sections", JSONB, nullable=True, server_default="[]"),
            sa.Column("class_advisor", sa.Boolean, nullable=True, server_default="false"),
            sa.Column("office_room", sa.String(120), nullable=True),
            sa.Column("experience", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("profile_picture", sa.String(500), nullable=True),
            sa.Column("full_name", sa.String(160), nullable=True),
            sa.Column("cabin", sa.String(120), nullable=True),
            sa.Column("profile_photo", sa.String(500), nullable=True),
            sa.Column("bio", sa.String(1000), nullable=True),
        )

    if not _table_exists("placement_profiles"):
        op.create_table(
            "placement_profiles",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
            sa.Column("department", sa.String(120), nullable=False),
            sa.Column("full_name", sa.String(160), nullable=True),
            sa.Column("designation", sa.String(120), nullable=True),
        )

    if not _table_exists("student_profiles"):
        op.create_table(
            "student_profiles",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer, unique=True, nullable=False),
            sa.Column("roll_number", sa.String(40), unique=True, nullable=False),
            sa.Column("department", sa.String(120), nullable=False),
            sa.Column("year", sa.Integer, nullable=False),
            sa.Column("cgpa", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("attendance_percentage", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("placement_readiness_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("risk_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("skill_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("registration_number", sa.String(40), nullable=True),
            sa.Column("course", sa.String(120), nullable=True, server_default="B.Tech"),
            sa.Column("branch", sa.String(120), nullable=True),
            sa.Column("section", sa.String(10), nullable=True),
            sa.Column("semester", sa.Integer, nullable=True),
            sa.Column("academic_year", sa.String(20), nullable=True),
            sa.Column("date_of_birth", sa.String(20), nullable=True),
            sa.Column("gender", sa.String(20), nullable=True),
            sa.Column("phone_number", sa.String(20), nullable=True),
            sa.Column("address", sa.Text, nullable=True),
            sa.Column("current_semester_gpa", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("credits_earned", sa.Integer, nullable=True, server_default="0"),
            sa.Column("total_credits", sa.Integer, nullable=True, server_default="180"),
            sa.Column("faculty_advisor", sa.String(120), nullable=True),
            sa.Column("resume_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("coding_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("mock_interview_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("applications", sa.Integer, nullable=True, server_default="0"),
            sa.Column("eligible_companies", sa.Integer, nullable=True, server_default="0"),
            sa.Column("offers", sa.Integer, nullable=True, server_default="0"),
            sa.Column("semester_gpas", JSONB, nullable=True, server_default="[]"),
            sa.Column("subjects_data", JSONB, nullable=True, server_default="[]"),
            sa.Column("skills_data", JSONB, nullable=True, server_default="{}"),
            sa.Column("certifications", JSONB, nullable=True, server_default="[]"),
            sa.Column("profile_photo_url", sa.String(500), nullable=True),
            sa.Column("communication_score", sa.Float, nullable=True, server_default="0.0"),
            sa.Column("preferred_role", sa.String(100), nullable=True),
            sa.Column("expected_package", sa.String(50), nullable=True),
            sa.Column("eligible_companies_list", JSONB, nullable=True, server_default="[]"),
            sa.Column("applied_companies_list", JSONB, nullable=True, server_default="[]"),
            sa.Column("github_url", sa.String(500), nullable=True),
            sa.Column("linkedin_url", sa.String(500), nullable=True),
            sa.Column("leetcode_url", sa.String(500), nullable=True),
            sa.Column("portfolio_url", sa.String(500), nullable=True),
            sa.Column("resume_url", sa.String(500), nullable=True),
            sa.Column("parent_name", sa.String(160), nullable=True),
            sa.Column("parent_phone", sa.String(20), nullable=True),
            sa.Column("parent_email", sa.String(255), nullable=True),
            sa.Column("linkedin_headline", sa.String(300), nullable=True),
            sa.Column("linkedin_about", sa.Text, nullable=True),
            sa.Column("linkedin_skills", sa.String(500), nullable=True),
            sa.Column("linkedin_open_to_work", sa.Integer, nullable=True, server_default="0"),
            sa.Column("faculty_id", sa.Integer, nullable=True),
            sa.Column("parent_id", sa.Integer, nullable=True),
            sa.Column("full_name", sa.String(160), nullable=True),
            sa.Column("profile_photo", sa.String(500), nullable=True),
            sa.Column("faculty_advisor_name", sa.String(160), nullable=True),
            sa.Column("bio", sa.Text, nullable=True),
            sa.Column("created_at", sa.DateTime, nullable=True, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime, nullable=True, server_default=sa.func.now()),
        )
        op.create_index("ix_student_profiles_user_id", "student_profiles", ["user_id"], unique=True)
        op.create_index("ix_student_profiles_roll_number", "student_profiles", ["roll_number"], unique=True)
        op.create_index("ix_student_profiles_faculty_id", "student_profiles", ["faculty_id"])
        op.create_index("ix_student_profiles_parent_id", "student_profiles", ["parent_id"])

    if not _table_exists("parent_profiles"):
        op.create_table(
            "parent_profiles",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
            sa.Column("student_id", sa.Integer, nullable=True),
            sa.Column("relation", sa.String(80), nullable=False),
            sa.Column("full_name", sa.String(160), nullable=True),
            sa.Column("phone", sa.String(20), nullable=True),
            sa.Column("occupation", sa.String(120), nullable=True),
        )
        op.create_foreign_key(
            "fk_parent_profiles_student_id_student_profiles",
            "parent_profiles", "student_profiles",
            ["student_id"], ["id"],
        )

    if not _table_exists("predictions"):
        op.create_table(
            "predictions",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("student_id", sa.Integer, nullable=False),
            sa.Column("prediction_type", sa.String(80), nullable=False),
            sa.Column("score", sa.Float, nullable=False),
            sa.Column("result", sa.String(120), nullable=False),
            sa.Column("explanation", sa.Text, nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        op.create_foreign_key(
            "fk_predictions_student_id_student_profiles",
            "predictions", "student_profiles",
            ["student_id"], ["id"],
        )

    if not _table_exists("skills"):
        op.create_table(
            "skills",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("student_id", sa.Integer, nullable=False),
            sa.Column("skill_name", sa.String(120), nullable=False),
            sa.Column("level", sa.Float, nullable=False, server_default="0"),
            sa.Column("target_level", sa.Float, nullable=False, server_default="100"),
        )
        op.create_foreign_key(
            "fk_skills_student_id_student_profiles",
            "skills", "student_profiles",
            ["student_id"], ["id"],
        )

    if not _table_exists("roadmaps"):
        op.create_table(
            "roadmaps",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("student_id", sa.Integer, nullable=False),
            sa.Column("title", sa.String(160), nullable=False),
            sa.Column("description", sa.Text, nullable=False),
            sa.Column("status", sa.String(40), nullable=False, server_default="planned"),
            sa.Column("due_date", sa.Date, nullable=True),
        )
        op.create_foreign_key(
            "fk_roadmaps_student_id_student_profiles",
            "roadmaps", "student_profiles",
            ["student_id"], ["id"],
        )

    if not _table_exists("notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer, primary_key=True, index=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
            sa.Column("title", sa.String(160), nullable=False),
            sa.Column("message", sa.Text, nullable=False),
            sa.Column("type", sa.String(40), nullable=False),
            sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("roadmaps")
    op.drop_table("skills")
    op.drop_table("predictions")
    op.drop_table("parent_profiles")
    op.drop_table("student_profiles")
    op.drop_table("placement_profiles")
    op.drop_table("faculty_profiles")
