from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.notification import Notification
from app.models.prediction import Prediction, Roadmap, Skill
from app.models.student import Student
from app.models.user import User, UserRole

router = APIRouter(prefix="/student", tags=["student"])


def _student_for_user(db: Session, user: User) -> Student:
    if user.role == UserRole.STUDENT:
        return db.query(Student).filter(Student.user_id == user.id).first()
    return db.query(Student).first()


@router.get("/dashboard")
def student_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))):
    student = _student_for_user(db, current_user)
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).limit(5).all()
    predictions = db.query(Prediction).filter(Prediction.student_id == student.id).limit(5).all() if student else []
    skills = db.query(Skill).filter(Skill.student_id == student.id).all() if student else []
    roadmaps = db.query(Roadmap).filter(Roadmap.student_id == student.id).all() if student else []

    profile = {"department": "AIML", "year": 4, "roll_number": "21AIML001", "current_semester": 8}
    if student:
        profile = {"department": student.department, "year": student.year, "roll_number": student.roll_number, "current_semester": student.year * 2}

    return {
        "role": "STUDENT",
        "user": {"full_name": current_user.full_name},
        "profile": profile,
        "overall": {
            "successScore": 82,
            "placementReadiness": 78,
            "academicRisk": "Low",
            "aiConfidence": 94,
            "nextBestAction": "Complete system design learning sprint this week.",
        },
        "kpis": [
            {"label": "CGPA", "value": "8.45", "trend": "+0.3", "progress": 84},
            {"label": "Attendance", "value": "92%", "trend": "+4%", "progress": 92},
            {"label": "Placement Readiness", "value": "78%", "trend": "+8%", "progress": 78},
            {"label": "Skill Score", "value": "74%", "trend": "+6%", "progress": 74},
            {"label": "Resume Score", "value": "81%", "trend": "+12%", "progress": 81},
            {"label": "Risk Score", "value": "Low", "trend": "-6%", "progress": 25},
        ],
        "charts": {
            "performanceTrend": [
                {"month": "Jan", "cgpa": 7.8, "attendance": 82, "readiness": 54},
                {"month": "Feb", "cgpa": 8.0, "attendance": 86, "readiness": 62},
                {"month": "Mar", "cgpa": 8.2, "attendance": 88, "readiness": 68},
                {"month": "Apr", "cgpa": 8.4, "attendance": 91, "readiness": 78},
                {"month": "May", "cgpa": 8.45, "attendance": 92, "readiness": 78},
                {"month": "Jun", "cgpa": 8.45, "attendance": 92, "readiness": 78},
            ],
            "skillRadar": [
                {"skill": "Python", "score": 85},
                {"skill": "Java", "score": 70},
                {"skill": "React", "score": 78},
                {"skill": "FastAPI", "score": 72},
                {"skill": "SQL", "score": 80},
                {"skill": "AI/ML", "score": 68},
            ],
            "skillGap": [
                {"skill": "Python", "current": 85, "target": 92},
                {"skill": "Java", "current": 70, "target": 82},
                {"skill": "React", "current": 78, "target": 88},
                {"skill": "FastAPI", "current": 72, "target": 85},
                {"skill": "SQL", "current": 80, "target": 90},
                {"skill": "AI/ML", "current": 68, "target": 82},
            ],
            "weeklyActivity": [
                {"week": "W1", "hours": 12, "tasks": 8},
                {"week": "W2", "hours": 15, "tasks": 10},
                {"week": "W3", "hours": 18, "tasks": 12},
                {"week": "W4", "hours": 14, "tasks": 9},
                {"week": "W5", "hours": 20, "tasks": 14},
                {"week": "W6", "hours": 16, "tasks": 11},
            ],
            "riskTimeline": [
                {"event": "Low attendance warning resolved", "date": "2 days ago", "type": "resolved"},
                {"event": "Resume improved", "date": "5 days ago", "type": "positive"},
                {"event": "Mock interview pending", "date": "Tomorrow", "type": "pending"},
                {"event": "Internship application due", "date": "In 3 days", "type": "warning"},
            ],
        },
        "recommendations": [
            {"title": "Complete System Design Sprint", "priority": "High", "reason": "Improves backend readiness and interview score.", "action": "Start Sprint"},
            {"title": "Book One Mock Interview", "priority": "Medium", "reason": "Placement readiness can improve by 12%.", "action": "Book Now"},
            {"title": "Improve AI/ML Skill Level", "priority": "Medium", "reason": "Your target role requires stronger ML basics.", "action": "View Course"},
            {"title": "Update Resume Projects Section", "priority": "High", "reason": "Resume score is currently 81%.", "action": "Update Resume"},
        ],
        "roadmap": [
            {"step": "Strengthen DSA Basics", "completed": 100, "status": "done"},
            {"step": "Complete FastAPI Backend Project", "completed": 75, "status": "in_progress"},
            {"step": "Build Resume Projects", "completed": 60, "status": "in_progress"},
            {"step": "Mock Interviews", "completed": 30, "status": "pending"},
            {"step": "Apply for Internships", "completed": 10, "status": "pending"},
            {"step": "Placement Ready", "completed": 0, "status": "pending"},
        ],
        "placementReadiness": {
            "resumeQuality": 81,
            "mockInterviewScore": 72,
            "technicalSkills": 76,
            "communication": 68,
            "projectStrength": 88,
        },
        "activities": [
            {"action": "Resume analyzed", "timestamp": "2 hours ago", "type": "analysis"},
            {"action": "Skill gap report generated", "timestamp": "1 day ago", "type": "report"},
            {"action": "Roadmap updated", "timestamp": "2 days ago", "type": "update"},
            {"action": "Placement prediction refreshed", "timestamp": "3 days ago", "type": "prediction"},
            {"action": "New AI recommendation created", "timestamp": "4 days ago", "type": "ai"},
        ],
        "tables": {"roadmap": [{"title": r.title, "status": r.status, "dueDate": str(r.due_date)} for r in roadmaps]},
        "notifications": [{"title": n.title, "message": n.message, "type": n.type} for n in notifications],
        "predictions": [{"type": p.prediction_type, "score": p.score, "result": p.result, "explanation": p.explanation} for p in predictions],
    }
