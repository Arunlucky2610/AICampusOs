from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    roll_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    cgpa: Mapped[float] = mapped_column(Float, default=0)
    attendance_percentage: Mapped[float] = mapped_column(Float, default=0)
    placement_readiness_score: Mapped[float] = mapped_column(Float, default=0)
    risk_score: Mapped[float] = mapped_column(Float, default=0)
    skill_score: Mapped[float] = mapped_column(Float, default=0)

    user = relationship("User", back_populates="student_profile")
    predictions = relationship("Prediction", back_populates="student")
    skills = relationship("Skill", back_populates="student")
    roadmaps = relationship("Roadmap", back_populates="student")
