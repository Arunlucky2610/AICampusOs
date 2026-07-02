from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TutorChat(Base):
    __tablename__ = "tutor_chats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    session_type: Mapped[str] = mapped_column(String(30), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    answer: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
