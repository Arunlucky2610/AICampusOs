from fastapi import APIRouter, Depends

from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/parent", tags=["parent"])


@router.get("/dashboard")
def parent_dashboard(_: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN]))):
    return {
        "role": "PARENT",
        "kpis": [
            {"label": "Attendance", "value": "91%", "trend": "+2%"},
            {"label": "CGPA", "value": 8.4, "trend": "+0.3"},
            {"label": "Readiness", "value": "78%", "trend": "+8%"},
            {"label": "Open Tasks", "value": 4, "trend": "-2"},
        ],
        "charts": {"progress": [{"week": "W1", "score": 64}, {"week": "W2", "score": 69}, {"week": "W3", "score": 75}, {"week": "W4", "score": 78}]},
        "tables": {"updates": [{"title": "Resume reviewed", "status": "Completed"}, {"title": "Mock interview", "status": "Scheduled"}]},
        "notifications": [{"title": "Advisor note", "message": "Student is on track for the placement sprint.", "type": "success"}],
        "predictions": [{"type": "RISK", "score": 18, "result": "Low risk"}],
        "recommendations": ["Encourage two mock interviews this month", "Review weekly roadmap completion"],
    }
