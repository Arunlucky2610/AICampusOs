import json
import logging
from typing import Optional, Literal

from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.tutor import TutorChat
from app.models.user import User
from app.services.tutor_ai_service import run_tutor_ai

logger = logging.getLogger(__name__)


def _normalize(result: dict, answer_field: str = "answer", default_answer: str = "") -> dict:
    normalized = dict(result)
    raw = normalized.pop("raw_response", None)
    if raw and isinstance(raw, str):
        normalized[answer_field] = raw
    for field in ("answer", "explanation", "summary"):
        if field not in normalized or not normalized.get(field):
            normalized[field] = default_answer if field == answer_field else ""
    for field in ("examples", "key_points", "next_steps"):
        normalized.setdefault(field, [])
    normalized.setdefault("error", None)
    return normalized


ASK_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).
{subjects_summary}

The student asks: "{question}" (topic: "{topic}", subject: "{subject}").

Teach like an expert mentor. Start from basics and progress to advanced insights.
Use **markdown** for formatting: headings (`##`), bold, bullet lists, and code blocks (```language...```) for code snippets.
Include real-world examples and practical applications.
Suggest follow-up questions the student should explore next.

Return valid JSON:
{{
  "answer": "Full markdown explanation covering beginner to advanced with code examples, analogies, and real-world applications. Use markdown formatting.",
  "examples": ["practical example 1 with explanation", "practical example 2"],
  "related_topics": ["related topic 1", "related topic 2", "related topic 3"],
  "difficulty_assessment": "easy / medium / hard",
  "suggested_resources": ["article or book 1", "online resource 2"]
}}"""

EXPLAIN_SIMPLE_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Explain "{topic}" in "{subject}" in SIMPLE terms. Use analogies from daily life, no jargon (define any you use), and keep it beginner-friendly.
Use **markdown** formatting. Include code examples in markdown code blocks where relevant.

Return valid JSON:
{{
  "explanation": "Complete markdown explanation with analogies, simple examples, and step-by-step breakdown. Use headings and bullet lists.",
  "examples": ["real-world example 1", "real-world example 2"],
  "analogies": ["analogy 1 explaining the concept", "analogy 2"],
  "formulas": [],
  "code_examples": ["code block showing simple implementation"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}}"""

EXPLAIN_ADVANCED_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Explain "{topic}" in "{subject}" at an ADVANCED level. Provide deep technical depth, design patterns, edge cases, and production considerations.
Use **markdown** formatting with headings, code blocks, and bullet lists.

Return valid JSON:
{{
  "explanation": "Deep technical markdown explanation with architecture, design decisions, trade-offs, and advanced code examples. Use headings (##, ###), code blocks (```language), and lists.",
  "examples": ["advanced example 1 with context", "advanced example 2"],
  "analogies": ["advanced analogy 1", "analogy 2"],
  "formulas": ["formula or equation 1", "formula or equation 2"],
  "code_examples": ["```language\ncode block with full implementation\n```", "```language\ncode block 2\n```"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}}"""

QUIZ_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).
{subjects_summary}

Generate {count} quiz questions (difficulty: {difficulty}) on "{topic}" in "{subject}".

Each question must have 4 options A/B/C/D, one correct answer, and a detailed explanation.
Include practical and application-based questions, not just definitions.
Mix difficulty levels appropriate for the student's level.

Return valid JSON:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text",
      "options": {{"A": "option A", "B": "option B", "C": "option C", "D": "option D"}},
      "correct_answer": "A",
      "explanation": "Why this is correct and common mistakes for other options",
      "difficulty": "easy / medium / hard"
    }}
  ]
}}"""

EVALUATE_QUIZ_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).

Evaluate this quiz on "{topic}" in "{subject}":

Quiz Results:
{results_summary}

Score: {score}/{total} ({percentage}%)

Analyze what the student got right and wrong. Identify weak areas and strong areas. Give specific, actionable recommendations for improvement. Suggest practice problems and study resources.

Return valid JSON:
{{
  "score": {score},
  "total": {total},
  "percentage": {percentage},
  "per_question_feedback": [
    {{"question_id": 1, "correct": true, "feedback": "Detailed feedback explaining both correct and incorrect reasoning"}}
  ],
  "weak_topics": ["topic that needs review", "another weak area"],
  "strong_topics": ["topic the student knows well", "another strength"],
  "recommendations": ["specific actionable recommendation 1", "recommendation 2 with resource suggestion", "recommendation 3"]
}}"""

STUDY_PLAN_PROMPT = """You are a personal AI tutor for a {year}-year {department} student (CGPA: {cgpa}).
{subjects_summary}

Create a {duration}-day study plan for "{subject}" with exam on {exam_date}.

Design a realistic, day-by-day plan. Include topic coverage, practice problems, revision days, and mock tests.
Consider the student's current subjects and workload. Make the plan achievable and effective.
Include practice problems, mini-projects, and interview-style questions alongside theoretical study.

Return valid JSON:
{{
  "plan": [
    {{
      "day": 1,
      "topics": ["specific topic 1", "specific topic 2"],
      "duration_hours": 2.5,
      "activities": ["Read and understand concept X", "Solve 5 practice problems", "Review with flashcards", "Write summary notes"],
      "resources": ["specific book chapter or online resource", "practice problem set link"]
    }}
  ],
  "total_hours": 17.5,
  "exam_strategy": "Detailed exam strategy covering time management, question selection, and revision approach",
  "prerequisites": ["knowledge area the student should have before starting", "another prerequisite"],
  "tips": ["practical tip 1", "motivational tip 2", "exam technique tip 3"]
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


def ask_doubt(db: Session, user: User, subject: str, topic: str, question: str, model_override: str = "default") -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = ASK_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, topic=topic, question=question,
    )
    try:
        model_param = model_override if model_override != "default" else None
        result = run_tutor_ai(prompt, f"Explain {topic} in {subject}.", model_override=model_param)
    except RuntimeError as e:
        logger.warning("Tutor ask failed: %s", e)
        result = {"answer": "", "explanation": "", "summary": "", "examples": [], "key_points": [], "next_steps": [], "related_topics": [], "difficulty_assessment": "", "suggested_resources": [], "error": str(e)}
    result = _normalize(result, answer_field="answer", default_answer="")
    _save_chat(db, user.id, "ask", subject, topic, question, result)
    return result


def explain_topic(db: Session, user: User, subject: str, topic: str, mode: Literal["simple", "advanced"], model_override: str = "default") -> dict:
    info = _get_student_info(db, user)
    prompt_template = EXPLAIN_SIMPLE_PROMPT if mode == "simple" else EXPLAIN_ADVANCED_PROMPT
    prompt = prompt_template.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subject=subject, topic=topic,
    )
    try:
        model_param = model_override if model_override != "default" else None
        result = run_tutor_ai(prompt, f"Explain {topic} ({mode} mode).", model_override=model_param)
    except RuntimeError as e:
        logger.warning("Tutor explain failed: %s", e)
        result = {"answer": "", "explanation": "", "summary": "", "examples": [], "key_points": [], "next_steps": [], "analogies": [], "formulas": [], "code_examples": [], "key_takeaways": [], "error": str(e)}
    result = _normalize(result, answer_field="explanation", default_answer="")
    _save_chat(db, user.id, f"explain_{mode}", subject, topic, None, result)
    return result


def generate_quiz(db: Session, user: User, subject: str, topic: str, count: int, difficulty: str, model_override: str = "default") -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = QUIZ_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, topic=topic, count=count, difficulty=difficulty,
    )
    try:
        model_param = model_override if model_override != "default" else None
        result = run_tutor_ai(prompt, f"Generate {count} quiz questions on {topic}.", model_override=model_param)
    except RuntimeError as e:
        logger.warning("Tutor quiz generation failed: %s", e)
        result = {"answer": "", "explanation": "", "summary": "", "examples": [], "key_points": [], "next_steps": [], "questions": [], "total_questions": 0, "error": str(e)}
    result = _normalize(result, answer_field="summary", default_answer="")
    questions = result.get("questions", [])
    if not questions and not result.get("error"):
        result["error"] = "Failed to parse quiz questions from AI response. The model may have returned non-JSON output."
    result["questions"] = questions
    result["total_questions"] = len(questions)
    return result


def evaluate_quiz(db: Session, user: User, subject: str, topic: str, answers: list[dict], model_override: str = "default") -> dict:
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
        model_param = model_override if model_override != "default" else None
        result = run_tutor_ai(prompt, "Evaluate this quiz.", model_override=model_param)
    except RuntimeError as e:
        logger.warning("Tutor quiz evaluation failed: %s", e)
        result = {
            "answer": "", "explanation": "", "summary": "", "examples": [], "key_points": [], "next_steps": [],
            "score": score, "total": total, "percentage": percentage,
            "per_question_feedback": [
                {"question_id": a.get("question_id", i), "correct": a.get("selected_answer", "").strip().upper() == a.get("correct_answer", "").strip().upper(), "feedback": "Review this topic."}
                for i, a in enumerate(answers)
            ],
            "weak_topics": ["Unable to determine"], "strong_topics": ["Unable to determine"],
            "recommendations": ["Review all questions and practice more."],
            "error": str(e),
        }
    result["score"] = result.get("score", score)
    result["total"] = result.get("total", total)
    result["percentage"] = result.get("percentage", percentage)
    result = _normalize(result, answer_field="summary", default_answer="")
    _save_chat(db, user.id, "evaluate_quiz", subject, topic, None, result)
    return result


def create_study_plan(db: Session, user: User, subject: str, exam_date: str, duration_days: Literal[7, 30], model_override: str = "default") -> dict:
    info = _get_student_info(db, user)
    subjects_summary = _get_student_academic_summary(db, user)
    prompt = STUDY_PLAN_PROMPT.format(
        year=info["year"], department=info["department"], cgpa=info["cgpa"],
        subjects_summary=subjects_summary,
        subject=subject, exam_date=exam_date, duration=duration_days,
    )
    try:
        model_param = model_override if model_override != "default" else None
        result = run_tutor_ai(prompt, f"Create a {duration_days}-day study plan for {subject}.", model_override=model_param)
    except RuntimeError as e:
        logger.warning("Tutor study plan failed: %s", e)
        result = {"answer": "", "explanation": "", "summary": "", "examples": [], "key_points": [], "next_steps": [], "plan": [], "total_hours": 0, "exam_strategy": "", "prerequisites": [], "tips": [], "error": str(e)}
    result = _normalize(result, answer_field="summary", default_answer="")
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
