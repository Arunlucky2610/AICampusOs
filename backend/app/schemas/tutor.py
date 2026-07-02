from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class TutorAskRequest(BaseModel):
    subject: str
    topic: str
    question: str


class TutorAskResponse(BaseModel):
    answer: str = ""
    explanation: str = ""
    summary: str = ""
    examples: List[str] = []
    key_points: List[str] = []
    next_steps: List[str] = []
    related_topics: List[str] = []
    difficulty_assessment: str = ""
    suggested_resources: List[str] = []
    error: Optional[str] = None


class TutorExplainRequest(BaseModel):
    subject: str
    topic: str
    mode: Literal["simple", "advanced"] = "simple"


class TutorExplainResponse(BaseModel):
    answer: str = ""
    explanation: str = ""
    summary: str = ""
    examples: List[str] = []
    key_points: List[str] = []
    next_steps: List[str] = []
    analogies: List[str] = []
    formulas: List[str] = []
    code_examples: List[str] = []
    key_takeaways: List[str] = []
    error: Optional[str] = None


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: dict[str, str]
    correct_answer: str
    explanation: str
    difficulty: str


class TutorQuizRequest(BaseModel):
    subject: str
    topic: str
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"


class TutorQuizResponse(BaseModel):
    answer: str = ""
    explanation: str = ""
    summary: str = ""
    examples: List[str] = []
    key_points: List[str] = []
    next_steps: List[str] = []
    questions: List[QuizQuestion] = []
    total_questions: int = 0
    error: Optional[str] = None


class QuizAnswer(BaseModel):
    question_id: int
    question: str
    selected_answer: str
    correct_answer: str


class TutorEvaluateQuizRequest(BaseModel):
    subject: str
    topic: str
    answers: List[QuizAnswer]


class PerQuestionFeedback(BaseModel):
    question_id: int
    correct: bool
    feedback: str


class TutorEvaluateQuizResponse(BaseModel):
    answer: str = ""
    explanation: str = ""
    summary: str = ""
    examples: List[str] = []
    key_points: List[str] = []
    next_steps: List[str] = []
    score: int = 0
    total: int = 0
    percentage: float = 0.0
    per_question_feedback: List[PerQuestionFeedback] = []
    weak_topics: List[str] = []
    strong_topics: List[str] = []
    recommendations: List[str] = []
    error: Optional[str] = None


class StudyPlanDay(BaseModel):
    day: int
    topics: List[str]
    duration_hours: float
    activities: List[str]
    resources: List[str]


class TutorStudyPlanRequest(BaseModel):
    subject: str
    exam_date: str
    duration_days: Literal[7, 30] = 7


class TutorStudyPlanResponse(BaseModel):
    answer: str = ""
    explanation: str = ""
    summary: str = ""
    examples: List[str] = []
    key_points: List[str] = []
    next_steps: List[str] = []
    plan: List[StudyPlanDay] = []
    total_hours: float = 0.0
    exam_strategy: str = ""
    prerequisites: List[str] = []
    tips: List[str] = []
    error: Optional[str] = None


class TutorHistoryItem(BaseModel):
    id: int
    session_type: str
    subject: Optional[str]
    topic: Optional[str]
    question: Optional[str]
    answer: Optional[dict]
    created_at: datetime


class TutorHistoryResponse(BaseModel):
    history: List[TutorHistoryItem]
