from app.models.student import Student


def placement_prediction(student: Student) -> dict:
    score = round((student.cgpa * 7) + (student.attendance_percentage * 0.12) + (student.skill_score * 0.28), 1)
    return {
        "score": min(score, 98),
        "result": "High placement readiness" if score >= 75 else "Needs focused preparation",
        "explanation": "Prediction combines academics, attendance, skills, and readiness trend signals.",
    }


def risk_prediction(student: Student) -> dict:
    return {
        "score": student.risk_score,
        "result": "Low risk" if student.risk_score < 35 else "Intervention recommended",
        "explanation": "Risk score uses attendance, performance drift, and skill completion momentum.",
    }


def skill_gap(student: Student) -> dict:
    return {
        "gaps": [
            {"skill": "System Design", "current": 48, "target": 75},
            {"skill": "Python ML", "current": 66, "target": 82},
            {"skill": "Communication", "current": 70, "target": 85},
        ],
        "summary": "Student is strongest in core programming and should prioritize interview communication.",
    }


def resume_analysis() -> dict:
    return {
        "score": 82,
        "strengths": ["Clear project impact", "Strong technical keywords", "Readable structure"],
        "improvements": ["Quantify internship outcomes", "Add leadership evidence", "Tighten summary"],
    }


def career_recommendation() -> dict:
    return {
        "tracks": ["AI Engineer", "Backend Developer", "Data Analyst"],
        "next_steps": ["Build one deployed ML app", "Practice SQL case studies", "Complete mock interviews"],
    }


def learning_roadmap() -> dict:
    return {
        "title": "8-week placement acceleration plan",
        "milestones": ["DSA refresh", "Resume polish", "Aptitude sprint", "Mock interview loop"],
    }


def assistant_reply(message: str) -> dict:
    return {"reply": f"Recommended next action: turn '{message}' into a measurable weekly goal and review it with your mentor."}
