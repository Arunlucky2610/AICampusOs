from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    employee_id: Mapped[str] = mapped_column(String(40), nullable=True)
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    subject_handling: Mapped[dict] = mapped_column(JSON, default=list)
    assigned_years: Mapped[dict] = mapped_column(JSON, default=list)
    assigned_sections: Mapped[dict] = mapped_column(JSON, default=list)
    class_advisor: Mapped[bool] = mapped_column(Boolean, default=False)
    office_room: Mapped[str] = mapped_column(String(120), nullable=True)
    experience: Mapped[float] = mapped_column(Float, default=0.0)
    profile_picture: Mapped[str] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="faculty_profile")
