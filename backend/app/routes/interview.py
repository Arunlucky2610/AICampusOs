import logging
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.interview import InterviewSession
from app.models.student import Student
from app.models.user import User
from app.schemas.interview import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnswerRequest,
    AnswerResponse,
    SessionStatusResponse,
    StartInterviewRequest,
    StartInterviewResponse,
)
from app.services.interview_service import (
    INTERVIEW_QUESTIONS_COUNT,
    analyze_answer,
    generate_full_analysis,
    generate_questions,
)
from app.services.speech_service import synthesize_speech, transcribe_audio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/mock", tags=["ai-mock-interview"])

UPLOAD_DIR = "uploads/interview_recordings"


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_session_or_404(session_id: int, user: User, db: Session) -> InterviewSession:
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")
    return session


@router.post("/start", response_model=StartInterviewResponse)
def start_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    student_id = student.id if student else None

    questions = generate_questions(db, user, payload.role)

    session = InterviewSession(
        user_id=user.id,
        student_id=student_id,
        role_applied_for=payload.role,
        status="in_progress",
        interview_type=payload.interview_type,
        questions=questions,
        answers=[],
        transcripts=[],
        recording_urls=[],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    first_question = questions[0] if questions else {
        "id": 1, "type": "general", "question": "Tell me about yourself.",
        "expected_keywords": [], "difficulty": "easy", "category": "General",
    }

    return StartInterviewResponse(
        session_id=session.id,
        question=first_question,
        question_number=1,
        total_questions=len(questions) or INTERVIEW_QUESTIONS_COUNT,
    )


@router.post("/answer", response_model=AnswerResponse)
def submit_answer(
    payload: AnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = _get_session_or_404(payload.session_id, user, db)
    questions = session.questions or []
    answers = list(session.answers or [])
    transcripts = list(session.transcripts or [])

    if payload.question_number < 1 or payload.question_number > len(questions):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question number")

    current_q = questions[payload.question_number - 1]
    analysis = analyze_answer(current_q, payload.answer_text)

    answer_entry = {
        "question_number": payload.question_number,
        "text": payload.answer_text,
        "analysis": analysis,
        "submitted_at": datetime.utcnow().isoformat(),
    }

    while len(answers) < payload.question_number:
        answers.append(None)
        transcripts.append(None)

    answers[payload.question_number - 1] = answer_entry
    transcripts[payload.question_number - 1] = payload.answer_text

    session.answers = answers
    session.transcripts = transcripts
    session.updated_at = datetime.utcnow()

    is_complete = payload.question_number >= len(questions)
    next_question = None

    if not is_complete:
        next_idx = payload.question_number
        if next_idx < len(questions):
            next_question = questions[next_idx]
    else:
        session.status = "completed"
        session.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    score = analysis.get("questionScore", 0)
    feedback = analysis.get("feedback", "")

    return AnswerResponse(
        next_question=next_question,
        question_number=payload.question_number + 1 if next_question else payload.question_number,
        total_questions=len(questions),
        is_complete=is_complete,
        question_score=score,
        question_feedback=feedback,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_interview(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = _get_session_or_404(payload.session_id, user, db)
    if session.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview is not yet completed")

    analysis = generate_full_analysis(db, session, user)

    score_keys = ["communicationScore", "confidenceScore", "clarityScore", "technicalScore", "projectKnowledgeScore"]
    scores = [analysis.get(k, 0) for k in score_keys]
    valid_scores = [s for s in scores if isinstance(s, (int, float))]
    avg_score = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0

    session.analysis = analysis
    session.score = avg_score
    session.feedback = analysis.get("finalVerdict", "")
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    return AnalyzeResponse(
        session_id=session.id,
        analysis=analysis,
        score=avg_score,
        feedback=session.feedback,
    )


@router.post("/upload-recording")
async def upload_recording(
    session_id: int,
    question_number: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_upload_dir()
    session = _get_session_or_404(session_id, user, db)

    ext = os.path.splitext(file.filename or ".webm")[1] or ".webm"
    filename = f"interview_{session_id}_q{question_number}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    recording_url = f"/uploads/interview_recordings/{filename}"
    urls = list(session.recording_urls or [])

    while len(urls) < question_number:
        urls.append(None)
    urls[question_number - 1] = recording_url

    session.recording_urls = urls
    session.updated_at = datetime.utcnow()
    db.commit()

    return {"url": recording_url, "filename": filename}


@router.post("/resume")
def resume_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = _get_session_or_404(session_id, user, db)
    questions = session.questions or []
    answers = session.answers or []

    last_idx = len([a for a in answers if a]) + 1
    next_idx = last_idx

    if session.status == "completed":
        return {
            "session_id": session.id,
            "status": "completed",
            "question_number": len(questions),
            "total_questions": len(questions),
            "next_question": None,
            "is_complete": True,
        }

    next_question = None
    if next_idx <= len(questions):
        next_question = questions[next_idx - 1]

    return {
        "session_id": session.id,
        "status": session.status,
        "question_number": next_idx,
        "total_questions": len(questions),
        "next_question": next_question,
        "is_complete": False,
    }


@router.get("/session/{session_id}", response_model=SessionStatusResponse)
def get_session_status(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = _get_session_or_404(session_id, user, db)
    return SessionStatusResponse(
        session_id=session.id,
        role_applied_for=session.role_applied_for,
        status=session.status,
        interview_type=session.interview_type,
        questions=session.questions or [],
        answers=session.answers or [],
        transcripts=session.transcripts or [],
        recording_urls=session.recording_urls or [],
        analysis=session.analysis,
        score=session.score,
        feedback=session.feedback,
        started_at=session.started_at,
        ended_at=session.ended_at,
    )


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return [
        {
            "session_id": s.id,
            "role": s.role_applied_for,
            "status": s.status,
            "score": s.score,
            "question_count": len(s.questions or []),
            "answer_count": len([a for a in (s.answers or []) if a]),
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
        }
        for s in sessions
    ]


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    content = await file.read()
    transcript = transcribe_audio(content, file.filename or "audio.webm")
    if transcript is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NVIDIA ASR unavailable.",
        )
    return {"text": transcript}


@router.post("/synthesize")
async def synthesize_speech_endpoint(
    text: str,
    _: User = Depends(get_current_user),
):
    audio_data = synthesize_speech(text)
    if audio_data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NVIDIA TTS unavailable.",
        )
    return Response(content=audio_data, media_type="audio/wav")
