from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    role: str = "Software Engineer"
    skills: list[str] = []
    interview_type: str = "text"


class StartInterviewResponse(BaseModel):
    session_id: int
    question: dict
    question_number: int
    total_questions: int


class AnswerRequest(BaseModel):
    session_id: int
    answer_text: str
    question_number: int


class AnswerResponse(BaseModel):
    next_question: Optional[dict]
    question_number: int
    total_questions: int
    is_complete: bool
    question_score: int = 0
    question_feedback: str = ""


class AnalyzeRequest(BaseModel):
    session_id: int


class AnalyzeResponse(BaseModel):
    session_id: int
    analysis: dict
    score: float
    feedback: Optional[str]


class SessionStatusResponse(BaseModel):
    session_id: int
    role_applied_for: Optional[str]
    status: str
    interview_type: str
    questions: list
    answers: list
    transcripts: list
    recording_urls: list
    analysis: Optional[dict]
    score: Optional[float]
    feedback: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
