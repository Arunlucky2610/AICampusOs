import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
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
from app.services import tutor_service, tutor_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/tutor", tags=["ai-tutor"])


@router.get("/health")
def tutor_health():
    from app.core.config import get_settings
    settings = get_settings()
    has_key = bool(settings.ai_tutor_api_key or settings.nvidia_api_key)
    return {
        "provider": "nvidia",
        "model": settings.ai_tutor_model,
        "hasApiKey": has_key,
        "baseUrl": settings.ai_tutor_base_url or settings.ai_base_url,
        "status": "ok" if has_key else "missing_api_key",
    }


@router.post("/ask", response_model=TutorAskResponse)
def ask_doubt(
    payload: TutorAskRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")
    result = tutor_service.ask_doubt(db, user, payload.subject, payload.topic, payload.question, model_override=model)
    return TutorAskResponse(**result)


@router.post("/explain", response_model=TutorExplainResponse)
def explain_topic(
    payload: TutorExplainRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.explain_topic(db, user, payload.subject, payload.topic, payload.mode, model_override=model)
    return TutorExplainResponse(**result)


@router.post("/quiz", response_model=TutorQuizResponse)
def generate_quiz(
    payload: TutorQuizRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.generate_quiz(db, user, payload.subject, payload.topic, payload.question_count, payload.difficulty, model_override=model)
    return TutorQuizResponse(**result)


@router.post("/evaluate-quiz", response_model=TutorEvaluateQuizResponse)
def evaluate_quiz(
    payload: TutorEvaluateQuizRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers provided.")
    result = tutor_service.evaluate_quiz(
        db, user, payload.subject, payload.topic,
        [a.model_dump() for a in payload.answers],
        model_override=model,
    )
    return TutorEvaluateQuizResponse(**result)


@router.post("/study-plan", response_model=TutorStudyPlanResponse)
def study_plan(
    payload: TutorStudyPlanRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = tutor_service.create_study_plan(db, user, payload.subject, payload.exam_date, payload.duration_days, model_override=model)
    return TutorStudyPlanResponse(**result)


@router.get("/history", response_model=TutorHistoryResponse)
def chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    history = tutor_service.get_chat_history(db, user, limit)
    return TutorHistoryResponse(history=[TutorHistoryItem(**h) for h in history])


# ── Streaming endpoints ──────────────────────────────────────────────────────────

def _build_ask_prompt(payload: TutorAskRequest, db: Session, user: User):
    return tutor_service.ASK_PROMPT.format(
        **tutor_service._get_student_info(db, user),
        subjects_summary=tutor_service._get_student_academic_summary(db, user),
        subject=payload.subject, topic=payload.topic, question=payload.question,
    )


def _build_explain_prompt(payload: TutorExplainRequest, db: Session, user: User):
    template = tutor_service.EXPLAIN_SIMPLE_PROMPT if payload.mode == "simple" else tutor_service.EXPLAIN_ADVANCED_PROMPT
    return template.format(
        **tutor_service._get_student_info(db, user),
        subject=payload.subject, topic=payload.topic,
    )


@router.post("/ask/stream")
async def ask_doubt_stream(
    payload: TutorAskRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")
    prompt = _build_ask_prompt(payload, db, user)

    async def event_stream():
        buffer = ""
        model_override = "fallback" if model == "fallback" else None
        async for event in tutor_ai_service.stream_tutor_ai(prompt, f"Explain {payload.topic} in {payload.subject}.", model_override=model_override):
            yield event
            try:
                data = json.loads(event[6:])
                if data.get("type") == "result":
                    buffer = data["content"]
            except (json.JSONDecodeError, KeyError, IndexError):
                pass
        if buffer:
            try:
                tutor_service._save_chat(db, user.id, "ask", payload.subject, payload.topic, payload.question, buffer if isinstance(buffer, dict) else {"raw_response": str(buffer)})
            except Exception:
                pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/explain/stream")
async def explain_topic_stream(
    payload: TutorExplainRequest,
    model: str = Query("default", description="Model to use: 'default' or 'fallback'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    prompt = _build_explain_prompt(payload, db, user)

    async def event_stream():
        model_override = "fallback" if model == "fallback" else None
        async for event in tutor_ai_service.stream_tutor_ai(prompt, f"Explain {payload.topic} ({payload.mode} mode).", model_override=model_override):
            yield event

    return StreamingResponse(event_stream(), media_type="text/event-stream")
