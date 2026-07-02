import json
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.interview import InterviewSession
from app.models.student import Student
from app.models.user import User
from app.services.ai_service import run_ai

logger = logging.getLogger(__name__)

INTERVIEW_QUESTIONS_COUNT = 6

_context_cache: dict[int, dict] = {}
_cache_ttl = 300

QUESTION_GENERATION_PROMPT = """You are a technical interviewer for a {role} position.

Student: {student_name}, {student_department}, Year {student_year}
CGPA: {student_cgpa}, Skills: {student_skills}, Target Role: {preferred_role}

Generate exactly {count} interview questions (progressively harder: 2 easy, 2 medium, 2 hard).
Categories: Technical, Project, Behavioral, System Design, Domain.

Return ONLY valid JSON:
{{"questions": [
  {{"id": 1, "type": "technical", "question": "...", "expected_keywords": ["k1","k2"], "difficulty": "easy", "category": "Project"}}
]}}"""

ANSWER_ANALYSIS_PROMPT = """Evaluate this interview answer briefly. Return ONLY valid JSON:
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

FULL_ANALYSIS_PROMPT = """You are a senior interview panelist. Analyze this mock interview.

Student: {student_name}, {student_department}, Year {student_year}
CGPA: {student_cgpa}, Skills: {student_skills}, Role: {role}

Q&A:
{qa_pairs}

Return ONLY valid JSON:
{{
  "communicationScore": <0-100>,
  "confidenceScore": <0-100>,
  "clarityScore": <0-100>,
  "technicalScore": <0-100>,
  "projectKnowledgeScore": <0-100>,
  "grammarFeedback": "...",
  "strengths": ["s1","s2","s3"],
  "weaknesses": ["w1","w2"],
  "exactWeakAreas": ["area1"],
  "idealAnswer": "Summary of strong answer",
  "followUpQuestion": "A follow-up question",
  "improvementPlan": ["step1","step2","step3","step4","step5"],
  "finalVerdict": "2-3 sentence verdict"
}}

Score fairly (0-100). Do not inflate."""


def _get_student_context(db: Session, user: User) -> dict:
    if user.id in _context_cache:
        return _context_cache[user.id]
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        ctx = {
            "student_name": user.full_name,
            "student_department": "Not specified",
            "student_year": "N/A",
            "student_cgpa": "N/A",
            "student_skills": "Not specified",
            "preferred_role": "Not specified",
        }
        _context_cache[user.id] = ctx
        return ctx
    skills = student.skills_data or {}
    skills_flat = []
    for cat, items in skills.items():
        if isinstance(items, list):
            skills_flat.extend(items)
    ctx = {
        "student_name": user.full_name,
        "student_department": student.department or "Not specified",
        "student_year": str(student.year) if student.year else "N/A",
        "student_cgpa": str(student.cgpa) if student.cgpa else "N/A",
        "student_skills": ", ".join(skills_flat) or "Not specified",
        "preferred_role": student.preferred_role or "Not specified",
    }
    _context_cache[user.id] = ctx
    return ctx


def invalidate_context_cache(user_id: int):
    _context_cache.pop(user_id, None)


def generate_questions(db: Session, user: User, role: str) -> list[dict]:
    ctx = _get_student_context(db, user)
    system_prompt = QUESTION_GENERATION_PROMPT.format(
        role=role, count=INTERVIEW_QUESTIONS_COUNT, **ctx,
    )
    result = run_ai(system_prompt, "Generate interview questions.")
    questions = result.get("questions", [])
    if not questions:
        questions = _fallback_questions(role)
    return questions


def _fallback_questions(role: str) -> list[dict]:
    return [
        {"id": 1, "type": "technical", "question": f"Tell me about yourself and your experience with {role} roles.", "expected_keywords": ["experience", "skills", "motivation"], "difficulty": "easy", "category": "Behavioral"},
        {"id": 2, "type": "technical", "question": f"What are the key technical skills required for a {role} position?", "expected_keywords": ["programming", "algorithms", "data structures"], "difficulty": "easy", "category": "Technical"},
        {"id": 3, "type": "technical", "question": "Describe a challenging project you worked on and how you solved the problems.", "expected_keywords": ["project", "challenge", "solution", "impact"], "difficulty": "medium", "category": "Project"},
        {"id": 4, "type": "technical", "question": "How would you design a scalable web application? Walk me through your approach.", "expected_keywords": ["architecture", "scalability", "database", "caching"], "difficulty": "medium", "category": "System Design"},
        {"id": 5, "type": "behavioral", "question": "Tell me about a time you had a conflict in a team and how you resolved it.", "expected_keywords": ["conflict", "resolution", "teamwork", "communication"], "difficulty": "hard", "category": "Behavioral"},
        {"id": 6, "type": "technical", "question": f"What industry trends do you think will impact {role} roles in the next 5 years?", "expected_keywords": ["trends", "innovation", "learning"], "difficulty": "hard", "category": "Domain"},
    ]


def analyze_answer(question: dict, answer_text: str) -> dict:
    prompt = ANSWER_ANALYSIS_PROMPT.format(
        question=question.get("question", ""),
        category=question.get("category", "General"),
        answer=answer_text[:1500],
    )
    try:
        return run_ai(prompt, "Analyze answer.")
    except Exception as e:
        logger.warning("Answer analysis failed: %s", e)
        return {
            "questionScore": 70,
            "strengths": ["Attempted to answer"],
            "weaknesses": [],
            "missedKeywords": [],
            "feedback": "Noted.",
            "idealAnswer": question.get("question", ""),
        }


def generate_full_analysis(db: Session, session: InterviewSession, user: User) -> dict:
    ctx = _get_student_context(db, user)
    qa_pairs = []
    for i, q in enumerate(session.questions or []):
        answer = ""
        if session.answers and i < len(session.answers):
            answer = (session.answers[i] or {}).get("text", "")
        qa_pairs.append(f"Q{i+1}: {q.get('question', '')}\nA: {answer[:500]}")

    prompt = FULL_ANALYSIS_PROMPT.format(
        role=session.role_applied_for or "Software Engineer",
        qa_pairs="\n\n".join(qa_pairs),
        **ctx,
    )
    try:
        result = run_ai(prompt, "Generate comprehensive analysis.")
        required_keys = [
            "communicationScore", "confidenceScore", "clarityScore",
            "technicalScore", "projectKnowledgeScore", "grammarFeedback",
            "strengths", "weaknesses", "exactWeakAreas", "idealAnswer",
            "followUpQuestion", "improvementPlan", "finalVerdict",
        ]
        for key in required_keys:
            if key not in result:
                result[key] = _default_analysis_value(key)
        return result
    except Exception as e:
        logger.warning("Full analysis failed: %s", e)
        return {
            "communicationScore": 70, "confidenceScore": 70, "clarityScore": 70,
            "technicalScore": 70, "projectKnowledgeScore": 70,
            "grammarFeedback": "Analysis unavailable.",
            "strengths": ["Attempted all questions"],
            "weaknesses": ["Deep analysis unavailable"],
            "exactWeakAreas": ["Unable to determine"],
            "idealAnswer": "Review standard interview preparation materials.",
            "followUpQuestion": "What would you do differently next time?",
            "improvementPlan": [
                "Practice more mock interviews",
                "Review core technical concepts",
                "Work on communication clarity",
                "Study system design patterns",
                "Prepare behavioral stories",
            ],
            "finalVerdict": "Keep practicing. Mock interviews are the best way to improve.",
        }


def _default_analysis_value(key: str):
    defaults = {
        "communicationScore": 0, "confidenceScore": 0, "clarityScore": 0,
        "technicalScore": 0, "projectKnowledgeScore": 0,
        "grammarFeedback": "", "strengths": [], "weaknesses": [],
        "exactWeakAreas": [], "idealAnswer": "", "followUpQuestion": "",
        "improvementPlan": [], "finalVerdict": "",
    }
    return defaults.get(key, "")
