import json
import logging
from typing import Optional, Literal

from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.tutor import TutorChat
from app.models.user import User
from app.services.ai_service import run_ai

logger = logging.getLogger(__name__)

ASK_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

The student has the following subjects with marks:
{subjects_summary}

They are studying "{topic}" in "{subject}" and ask:
"{question}"

Act like an experienced teacher. Explain the concept clearly, then provide examples, related topics the student should also study, assess the difficulty level relative to their current performance, and suggest resources.

Return ONLY valid JSON:
{{
  "answer": "Clear, thorough explanation tailored to student level",
  "examples": ["example1", "example2"],
  "related_topics": ["topic1", "topic2", "topic3"],
  "difficulty_assessment": "easy/medium/hard relative to student",
  "suggested_resources": ["resource1", "resource2"]
}}"""

EXPLAIN_SIMPLE_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

They want a SIMPLE explanation of "{topic}" in "{subject}". Use NO jargon unless explained. Use analogies from daily life. Keep it beginner-friendly.

Return ONLY valid JSON:
{{
  "explanation": "Simple explanation with analogies from real life",
  "examples": ["real-world example 1", "real-world example 2"],
  "analogies": ["analogy 1", "analogy 2"],
  "formulas": [],
  "code_examples": [],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}}"""

EXPLAIN_ADVANCED_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

They want an ADVANCED technical explanation of "{topic}" in "{subject}". Provide depth, formulas, code, and design considerations.

Return ONLY valid JSON:
{{
  "explanation": "Deep technical explanation suitable for advanced learners",
  "examples": ["technical example 1", "technical example 2"],
  "analogies": ["analogy 1", "analogy 2"],
  "formulas": ["formula or equation 1", "formula or equation 2"],
  "code_examples": ["code block 1 showing implementation", "code block 2"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}}"""

QUIZ_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Generate {count} quiz questions (difficulty: {difficulty}) on "{topic}" in "{subject}".

Each question must have 4 options A/B/C/D, one correct answer, and an explanation.

Student's subjects:
{subjects_summary}

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text",
      "options": {{"A": "option A", "B": "option B", "C": "option C", "D": "option D"}},
      "correct_answer": "A",
      "explanation": "Why this is correct and others are wrong",
      "difficulty": "easy/medium/hard"
    }}
  ]
}}"""

EVALUATE_QUIZ_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Evaluate this quiz on "{topic}" in "{subject}":

Quiz Results:
{results_summary}

Score: {score}/{total} ({percentage}%)

Analyze what the student got right and wrong. Identify weak areas and strong areas. Give specific recommendations.

Return ONLY valid JSON:
{{
  "score": {score},
  "total": {total},
  "percentage": {percentage},
  "per_question_feedback": [
    {{"question_id": 1, "correct": true, "feedback": "Brief feedback on this question"}}
  ],
  "weak_topics": ["topic1", "topic2"],
  "strong_topics": ["topic1", "topic2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}"""

STUDY_PLAN_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Create a {duration}-day study plan for "{subject}" with exam on {exam_date}.

Student's current subjects and marks:
{subjects_summary}

Design a realistic plan with daily topics, time allocation, activities, and resources. Include exam strategy, prerequisites, and tips.

Return ONLY valid JSON:
{{
  "plan": [
    {{
      "day": 1,
      "topics": ["topic1", "topic2"],
      "duration_hours": 2.0,
      "activities": ["Read chapter X", "Solve problems Y", "Review notes"],
      "resources": ["resource URL or title 1", "resource 2"]
    }}
  ],
  "total_hours": 14.0,
  "exam_strategy": "Strategy paragraph",
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}}"""


def _get_student_academic_summary(db: Session, user: User) -> str:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        return "No academic data available. Teach at a general college level."
    subjects = student.subjects_data or []
    lines = [f"- {s.get('code','')} {s.get('name','')}: {s.get('total_marks', 'N/A')} marks (Internal: {s.get('internal_marks', 'N/A')}, External: {s.get('external_marks', 'N/A')})" for s in subjects]
    summary = "\n".join(lines) if lines else "No specific subject data available."
    return f"CGPA: {student.cgpa or 'N/A'}, Attendance: {student.attendance_percentage or 'N/A'}%\nSubjects:\n{summary}"


def _get_student_info(db: Session, user: User) -> dict:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        return {"year": "college", "department": "general", "cgpa": "N/A"}
    return {
        "year": f"{student.year}-year" if student.year else "college",
        "department": student.department or "general",
        "cgpa": str(student.cgpa) if student.cgpa else "N/A",
    }


def ask_doubt(db: Session, user: User, subject: str, topic: str, question: str) -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = ASK_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, topic=topic, question=question,
    )
    try:
        result = run_ai(prompt, f"Explain {topic} in {subject}.")
    except Exception as e:
        logger.warning("Tutor ask failed: %s", e)
        result = {
            "answer": "I'm unable to process your question right now. Please try again.",
            "examples": [], "related_topics": [], "difficulty_assessment": "unknown",
            "suggested_resources": [],
        }
    _save_chat(db, user.id, "ask", subject, topic, question, result)
    return result


def explain_topic(db: Session, user: User, subject: str, topic: str, mode: Literal["simple", "advanced"]) -> dict:
    info = _get_student_info(db, user)
    prompt_template = EXPLAIN_SIMPLE_PROMPT if mode == "simple" else EXPLAIN_ADVANCED_PROMPT
    prompt = prompt_template.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subject=subject, topic=topic,
    )
    try:
        result = run_ai(prompt, f"Explain {topic} ({mode} mode).")
    except Exception as e:
        logger.warning("Tutor explain failed: %s", e)
        result = {
            "explanation": f"Explanation unavailable for {topic}. Please try again.",
            "examples": [], "analogies": [], "formulas": [], "code_examples": [],
            "key_takeaways": [],
        }
    _save_chat(db, user.id, f"explain_{mode}", subject, topic, None, result)
    return result


def generate_quiz(db: Session, user: User, subject: str, topic: str, count: int, difficulty: str) -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = QUIZ_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, topic=topic, count=count, difficulty=difficulty,
    )
    try:
        result = run_ai(prompt, f"Generate {count} quiz questions on {topic}.")
        questions = result.get("questions", [])
        return {"questions": questions, "total_questions": len(questions)}
    except Exception as e:
        logger.warning("Tutor quiz generation failed: %s", e)
        return {"questions": [], "total_questions": 0}


def evaluate_quiz(db: Session, user: User, subject: str, topic: str, answers: list[dict]) -> dict:
    info = _get_student_info(db, user)
    total = len(answers)
    score = sum(1 for a in answers if a.get("selected_answer", "").strip().upper() == a.get("correct_answer", "").strip().upper())
    percentage = round((score / total) * 100, 1) if total > 0 else 0

    results_lines = []
    for a in answers:
        correct = a.get("selected_answer", "").strip().upper() == a.get("correct_answer", "").strip().upper()
        results_lines.append(f"Q{a.get('question_id', '?')}: {a.get('question', '')[:100]} | Selected: {a.get('selected_answer', 'N/A')} | Correct: {a.get('correct_answer', 'N/A')} | {'CORRECT' if correct else 'WRONG'}")

    prompt = EVALUATE_QUIZ_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subject=subject, topic=topic,
        results_summary="\n".join(results_lines),
        score=score, total=total, percentage=percentage,
    )
    try:
        result = run_ai(prompt, "Evaluate this quiz.")
    except Exception as e:
        logger.warning("Tutor quiz evaluation failed: %s", e)
        result = {
            "score": score, "total": total, "percentage": percentage,
            "per_question_feedback": [
                {"question_id": a.get("question_id", i), "correct": a.get("selected_answer", "").strip().upper() == a.get("correct_answer", "").strip().upper(), "feedback": "Review this topic."}
                for i, a in enumerate(answers)
            ],
            "weak_topics": ["Unable to determine"],
            "strong_topics": ["Unable to determine"],
            "recommendations": ["Review all questions and practice more."],
        }
    _save_chat(db, user.id, "evaluate_quiz", subject, topic, None, result)
    return result


def create_study_plan(db: Session, user: User, subject: str, exam_date: str, duration_days: Literal[7, 30]) -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = STUDY_PLAN_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, exam_date=exam_date, duration=duration_days,
    )
    try:
        result = run_ai(prompt, f"Create a {duration_days}-day study plan for {subject}.")
    except Exception as e:
        logger.warning("Tutor study plan failed: %s", e)
        result = {
            "plan": [], "total_hours": 0,
            "exam_strategy": "Unable to generate plan. Please try again.",
            "prerequisites": [], "tips": [],
        }
    _save_chat(db, user.id, "study_plan", subject, topic=None, question=None, answer=result)
    return result


def get_chat_history(db: Session, user: User, limit: int = 50) -> list[dict]:
    chats = (
        db.query(TutorChat)
        .filter(TutorChat.user_id == user.id)
        .order_by(TutorChat.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "session_type": c.session_type,
            "subject": c.subject,
            "topic": c.topic,
            "question": c.question,
            "answer": c.answer,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in chats
    ]


def _save_chat(db: Session, user_id: int, session_type: str, subject: Optional[str], topic: Optional[str], question: Optional[str], answer: dict):
    try:
        chat = TutorChat(
            user_id=user_id, session_type=session_type,
            subject=subject, topic=topic, question=question,
            answer=answer,
        )
        db.add(chat)
        db.commit()
    except Exception as e:
        logger.warning("Failed to save tutor chat: %s", e)
        db.rollback()
