import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.tutor import (
    TutorAskRequest,
    TutorAskResponse,
    TutorExplainRequest,
    TutorExplainResponse,
    TutorQuizRequest,
    TutorQuizResponse,
    TutorEvaluateQuizRequest,
    TutorEvaluateQuizResponse,
    TutorStudyPlanRequest,
    TutorStudyPlanResponse,
    TutorHistoryResponse,
    TutorHistoryItem,
)
from app.services import tutor_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/tutor", tags=["ai-tutor"])


@router.post("/ask", response_model=TutorAskResponse)
def ask_doubt(
    payload: TutorAskRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")
    result = tutor_service.ask_doubt(db, user, payload.subject, payload.topic, payload.question)
    return TutorAskResponse(**result)


@router.post("/explain", response_model=TutorExplainResponse)
def explain_topic(
    payload: TutorExplainRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.explain_topic(db, user, payload.subject, payload.topic, payload.mode)
    return TutorExplainResponse(**result)


@router.post("/quiz", response_model=TutorQuizResponse)
def generate_quiz(
    payload: TutorQuizRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.generate_quiz(db, user, payload.subject, payload.topic, payload.question_count, payload.difficulty)
    if result["total_questions"] == 0:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to generate quiz questions.")
    return TutorQuizResponse(**result)


@router.post("/evaluate-quiz", response_model=TutorEvaluateQuizResponse)
def evaluate_quiz(
    payload: TutorEvaluateQuizRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers provided.")
    result = tutor_service.evaluate_quiz(
        db, user, payload.subject, payload.topic,
        [a.model_dump() for a in payload.answers],
    )
    return TutorEvaluateQuizResponse(**result)


@router.post("/study-plan", response_model=TutorStudyPlanResponse)
def study_plan(
    payload: TutorStudyPlanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.create_study_plan(db, user, payload.subject, payload.exam_date, payload.duration_days)
    return TutorStudyPlanResponse(**result)


@router.get("/history", response_model=TutorHistoryResponse)
def chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    history = tutor_service.get_chat_history(db, user, limit)
    return TutorHistoryResponse(history=[TutorHistoryItem(**h) for h in history])
