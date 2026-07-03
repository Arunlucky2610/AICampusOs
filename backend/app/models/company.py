from typing import Optional

from sqlalchemy import Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), nullable=False)
    required_cgpa: Mapped[float] = mapped_column(Float, default=0.0)
    required_skills: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    allowed_departments: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    backlog_policy: Mapped[str] = mapped_column(String(300), default="No restrictions")
    package: Mapped[str] = mapped_column(String(100), default="")
    drive_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    min_resume_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    min_coding_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    min_mock_interview_score: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
