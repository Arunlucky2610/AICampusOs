from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.faculty import FacultyProfile
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.user import UserAdminRead

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(db: Session = Depends(get_db), _: User = Depends(require_roles([UserRole.ADMIN]))):
    users = db.query(User).order_by(User.created_at.desc()).limit(8).all()
    return {
        "role": "ADMIN",
        "kpis": [
            {"label": "Total Users", "value": db.query(User).count(), "trend": "+18%"},
            {"label": "Students", "value": db.query(Student).count(), "trend": "+9%"},
            {"label": "Faculty", "value": db.query(FacultyProfile).count(), "trend": "+4%"},
            {"label": "Active Alerts", "value": 23, "trend": "-7"},
        ],
        "charts": {"activity": [{"day": "Mon", "events": 220}, {"day": "Tue", "events": 340}, {"day": "Wed", "events": 410}, {"day": "Thu", "events": 390}]},
        "tables": {"users": [{"name": u.full_name, "email": u.email, "role": u.role.value, "active": u.is_active} for u in users]},
        "notifications": [{"title": "AI monitor", "message": "Prediction services healthy with 99.2% uptime.", "type": "success"}],
        "predictions": [{"type": "SYSTEM", "score": 94, "result": "Healthy AI operations"}],
        "recommendations": ["Review role permissions quarterly", "Export placement analytics for accreditation"],
    }


@router.get("/debug/users", response_model=list[UserAdminRead])
def debug_users(db: Session = Depends(get_db), _: User = Depends(require_roles([UserRole.ADMIN]))):
    return db.query(User).order_by(User.email.asc()).all()
