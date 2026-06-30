from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    # Personal Information
    roll_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    registration_number: Mapped[str] = mapped_column(String(40), nullable=True)
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    course: Mapped[str] = mapped_column(String(120), nullable=True, default="B.Tech")
    branch: Mapped[str] = mapped_column(String(120), nullable=True)
    section: Mapped[str] = mapped_column(String(10), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=True)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[str] = mapped_column(String(20), nullable=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    profile_photo_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Academic Information
    cgpa: Mapped[float] = mapped_column(Float, default=0.0)
    current_semester_gpa: Mapped[float] = mapped_column(Float, default=0.0)
    attendance_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    credits_earned: Mapped[int] = mapped_column(Integer, default=0)
    total_credits: Mapped[int] = mapped_column(Integer, default=180)
    faculty_advisor: Mapped[str] = mapped_column(String(120), nullable=True)

    # Placement Information
    placement_readiness_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    skill_score: Mapped[float] = mapped_column(Float, default=0.0)
    resume_score: Mapped[float] = mapped_column(Float, default=0.0)
    coding_score: Mapped[float] = mapped_column(Float, default=0.0)
    mock_interview_score: Mapped[float] = mapped_column(Float, default=0.0)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0)
    applications: Mapped[int] = mapped_column(Integer, default=0)
    eligible_companies: Mapped[int] = mapped_column(Integer, default=0)
    offers: Mapped[int] = mapped_column(Integer, default=0)
    preferred_role: Mapped[str] = mapped_column(String(100), nullable=True)
    expected_package: Mapped[str] = mapped_column(String(50), nullable=True)

    # Complex JSON data
    semester_gpas: Mapped[list] = mapped_column(JSON, default=list)
    subjects_data: Mapped[list] = mapped_column(JSON, default=list)
    skills_data: Mapped[dict] = mapped_column(JSON, default=dict)
    certifications: Mapped[list] = mapped_column(JSON, default=list)
    eligible_companies_list: Mapped[dict] = mapped_column(JSON, default=list)
    applied_companies_list: Mapped[dict] = mapped_column(JSON, default=list)

    # Links
    github_url: Mapped[str] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    leetcode_url: Mapped[str] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str] = mapped_column(String(500), nullable=True)
    resume_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Parent Information
    parent_name: Mapped[str] = mapped_column(String(160), nullable=True)
    parent_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    parent_email: Mapped[str] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="student_profile")
    predictions = relationship("Prediction", back_populates="student")
    skills = relationship("Skill", back_populates="student")
    roadmaps = relationship("Roadmap", back_populates="student")
