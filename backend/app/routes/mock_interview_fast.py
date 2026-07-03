import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.interview import InterviewSession
from app.models.student import Student
from app.models.user import User
from app.services.interview_service import (
    INTERVIEW_QUESTIONS_COUNT,
    run_mock_interview_ai,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mock-interview", tags=["mock-interview-fast"])

MOCK_INTERVIEW_TIMEOUT_SEC = 8


class FastStartRequest(BaseModel):
    role: str = "Software Engineer"
    interview_type: str = "text"


class FastQuestion(BaseModel):
    id: int
    type: str
    question: str
    expected_keywords: list[str] = []
    difficulty: str = "medium"
    category: str = "General"


class FastStartResponse(BaseModel):
    session_id: int
    question: FastQuestion
    question_number: int
    total_questions: int


class FastAnswerRequest(BaseModel):
    session_id: int
    answer_text: str
    question_number: int


class FastAnswerResponse(BaseModel):
    next_question: Optional[FastQuestion] = None
    question_number: int
    total_questions: int
    is_complete: bool
    question_score: int = 0
    question_feedback: str = ""


FALLBACK_QUESTIONS: list[dict] = [
    {"id": 1, "type": "technical", "question": "Tell me about yourself and your experience.", "expected_keywords": ["experience", "skills", "projects"], "difficulty": "easy", "category": "Behavioral"},
    {"id": 2, "type": "technical", "question": "What technical skills are most relevant for this role?", "expected_keywords": ["programming", "algorithms", "tools"], "difficulty": "easy", "category": "Technical"},
    {"id": 3, "type": "technical", "question": "Describe a challenging project and how you solved problems.", "expected_keywords": ["project", "challenge", "solution"], "difficulty": "medium", "category": "Project"},
    {"id": 4, "type": "technical", "question": "How would you approach designing a scalable system?", "expected_keywords": ["architecture", "scalability", "design"], "difficulty": "medium", "category": "System Design"},
    {"id": 5, "type": "behavioral", "question": "Tell me about a time you had a conflict in a team.", "expected_keywords": ["conflict", "resolution", "teamwork"], "difficulty": "hard", "category": "Behavioral"},
    {"id": 6, "type": "technical", "question": "What industry trends do you think will impact this role?", "expected_keywords": ["trends", "innovation", "learning"], "difficulty": "hard", "category": "Domain"},
]

FAST_QUESTION_PROMPT = """You are a technical interviewer for a {role} position.

Student: {student_name}, {student_department}, Year {student_year}
CGPA: {student_cgpa}, Skills: {student_skills}, Target Role: {preferred_role}

Generate exactly {count} interview questions (progressively harder: 2 easy, 2 medium, 2 hard).
Categories: Technical, Project, Behavioral, System Design, Domain.

Return ONLY valid JSON:
{{"questions": [
  {{"id": 1, "type": "technical", "question": "...", "expected_keywords": ["k1","k2"], "difficulty": "easy", "category": "Project"}}
]}}"""


FAST_ANSWER_PROMPT = """Evaluate this interview answer briefly. Return ONLY valid JSON:
{{
  "questionScore": <0-100>,
  "strengths": ["s1","s2"],
  "weaknesses": ["w1"],
  "missedKeywords": ["k1"],
  "feedback": "1-2 sentence feedback",
  "idealAnswer": "Concise ideal answer (1-2 sentences)"
}}

Question: {question}
Category: {category}
Answer: {answer}"""


_session_context_cache: dict[int, dict] = {}


def _get_basic_student_context(db: Session, user: User) -> dict:
    if user.id in _session_context_cache:
        return _session_context_cache[user.id]
    student = db.query(Student).filter(Student.user_id == user.id).first()
    ctx = {
        "student_name": user.full_name or "Candidate",
        "student_department": "Not specified",
        "student_year": "N/A",
        "student_cgpa": "N/A",
        "student_skills": "Not specified",
        "preferred_role": "Not specified",
    }
    if student:
        skills = student.skills_data or {}
        skills_flat = []
        for cat, items in skills.items():
            if isinstance(items, list):
                skills_flat.extend(items)
        ctx = {
            "student_name": user.full_name or "Candidate",
            "student_department": student.department or "Not specified",
            "student_year": str(student.year) if student.year else "N/A",
            "student_cgpa": str(student.cgpa) if student.cgpa else "N/A",
            "student_skills": ", ".join(skills_flat) or "Not specified",
            "preferred_role": student.preferred_role or "Not specified",
        }
    _session_context_cache[user.id] = ctx
    return ctx


def invalidate_context_cache(user_id: int):
    _session_context_cache.pop(user_id, None)


def _generate_fast_questions(role: str) -> list[dict]:
    return FALLBACK_QUESTIONS


def _generate_questions_ai(ctx: dict, role: str) -> Optional[list[dict]]:
    system_prompt = FAST_QUESTION_PROMPT.format(
        role=role, count=INTERVIEW_QUESTIONS_COUNT, **ctx,
    )
    try:
        result = run_mock_interview_ai(system_prompt, "Generate interview questions.", timeout=MOCK_INTERVIEW_TIMEOUT_SEC)
        questions = result.get("questions", [])
        if questions:
            return questions
    except Exception as e:
        logger.warning("Mock Interview AI question generation failed: %s", e)
    return None


@router.post("/start", response_model=FastStartResponse)
def start_mock_interview(
    payload: FastStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ctx = _get_basic_student_context(db, user)

    questions = _generate_questions_ai(ctx, payload.role)
    if not questions:
        questions = _generate_fast_questions(payload.role)

    student = db.query(Student).filter(Student.user_id == user.id).first()
    student_id = student.id if student else None

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

    first = questions[0] if questions else FALLBACK_QUESTIONS[0]
    return FastStartResponse(
        session_id=session.id,
        question=FastQuestion(**first),
        question_number=1,
        total_questions=len(questions) or INTERVIEW_QUESTIONS_COUNT,
    )


@router.post("/answer", response_model=FastAnswerResponse)
def submit_mock_interview_answer(
    payload: FastAnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == payload.session_id,
        InterviewSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    questions = session.questions or []
    if payload.question_number < 1 or payload.question_number > len(questions):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question number")

    current_q = questions[payload.question_number - 1]

    analysis = None
    try:
        prompt = FAST_ANSWER_PROMPT.format(
            question=current_q.get("question", ""),
            category=current_q.get("category", "General"),
            answer=payload.answer_text[:1500],
        )
        analysis = run_mock_interview_ai(prompt, "Analyze answer.", timeout=MOCK_INTERVIEW_TIMEOUT_SEC)
    except Exception as e:
        logger.warning("Mock Interview AI answer analysis failed: %s", e)

    score = (analysis or {}).get("questionScore", 70)
    feedback = (analysis or {}).get("feedback", "Answer recorded.")

    answer_entry = {
        "question_number": payload.question_number,
        "text": payload.answer_text,
        "analysis": {
            "questionScore": score,
            "strengths": (analysis or {}).get("strengths", ["Attempted to answer"]),
            "weaknesses": (analysis or {}).get("weaknesses", []),
            "missedKeywords": (analysis or {}).get("missedKeywords", []),
            "feedback": feedback,
            "idealAnswer": (analysis or {}).get("idealAnswer", current_q.get("question", "")),
        },
        "submitted_at": datetime.utcnow().isoformat(),
    }

    answers = list(session.answers or [])
    transcripts = list(session.transcripts or [])
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
            next_q = questions[next_idx]
            next_question = next_q
    else:
        session.status = "completed"
        session.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return FastAnswerResponse(
        next_question=FastQuestion(**next_question) if next_question else None,
        question_number=payload.question_number + 1 if next_question else payload.question_number,
        total_questions=len(questions),
        is_complete=is_complete,
        question_score=score,
        question_feedback=feedback,
    )
