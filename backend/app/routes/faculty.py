from fastapi import APIRouter, Depends

from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/dashboard")
def faculty_dashboard(_: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))):
    return {
        "role": "FACULTY",
        "kpis": [
            {"label": "Assigned Students", "value": 142, "trend": "+12"},
            {"label": "At Risk", "value": 18, "trend": "-5"},
            {"label": "Interventions", "value": 36, "trend": "+9"},
            {"label": "Avg Attendance", "value": "88%", "trend": "+3%"},
        ],
        "charts": {"risk": [{"name": "Low", "value": 82}, {"name": "Medium", "value": 42}, {"name": "High", "value": 18}]},
        "tables": {"students": [{"name": "Anika Rao", "risk": "Low", "readiness": 82}, {"name": "Kiran Mehta", "risk": "Medium", "readiness": 67}]},
        "notifications": [{"title": "Mentor review", "message": "12 students need weekly review.", "type": "warning"}],
        "predictions": [{"type": "RISK", "score": 22, "result": "Cohort improving"}],
        "recommendations": ["Prioritize medium-risk students with attendance drops", "Schedule placement-readiness labs"],
    }
