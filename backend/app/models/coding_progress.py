from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class CodingProgressCache(Base):
    __tablename__ = "coding_progress_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    github_username = Column(String(255), nullable=True)
    leetcode_username = Column(String(255), nullable=True)
    github_stats_json = Column(JSON, nullable=True, default=dict)
    leetcode_stats_json = Column(JSON, nullable=True, default=dict)
    linkedin_status_json = Column(JSON, nullable=True, default=dict)
    coding_score = Column(Float, default=0.0)
    placement_readiness_score = Column(Float, default=0.0)
    last_synced_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
