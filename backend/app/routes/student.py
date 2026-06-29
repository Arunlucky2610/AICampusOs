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
    return {
        "role": "STUDENT",
        "kpis": [
            {"label": "CGPA", "value": student.cgpa, "trend": "+0.3"},
            {"label": "Attendance", "value": f"{student.attendance_percentage}%", "trend": "+4%"},
            {"label": "Readiness", "value": f"{student.placement_readiness_score}%", "trend": "+8%"},
            {"label": "Risk", "value": f"{student.risk_score}%", "trend": "-6%"},
        ],
        "charts": {
            "readiness": [{"month": "Jan", "score": 54}, {"month": "Feb", "score": 62}, {"month": "Mar", "score": 68}, {"month": "Apr", "score": 78}],
            "skills": [{"name": skill.skill_name, "current": skill.level, "target": skill.target_level} for skill in skills],
        },
        "tables": {"roadmap": [{"title": r.title, "status": r.status, "dueDate": str(r.due_date)} for r in roadmaps]},
        "notifications": [{"title": n.title, "message": n.message, "type": n.type} for n in notifications],
        "predictions": [{"type": p.prediction_type, "score": p.score, "result": p.result, "explanation": p.explanation} for p in predictions],
        "recommendations": ["Complete the system design sprint", "Book one mock interview", "Upload the latest resume version"],
    }
