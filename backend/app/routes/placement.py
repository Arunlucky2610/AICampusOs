from fastapi import APIRouter, Depends

from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/placement", tags=["placement"])


@router.get("/dashboard")
def placement_dashboard(_: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]))):
    return {
        "role": "PLACEMENT_OFFICER",
        "kpis": [
            {"label": "Placement Rate", "value": "74%", "trend": "+11%"},
            {"label": "Ready Students", "value": 486, "trend": "+58"},
            {"label": "Active Drives", "value": 14, "trend": "+3"},
            {"label": "Avg Package", "value": "8.6 LPA", "trend": "+1.2"},
        ],
        "charts": {"placements": [{"month": "Jan", "offers": 32}, {"month": "Feb", "offers": 54}, {"month": "Mar", "offers": 81}, {"month": "Apr", "offers": 116}]},
        "tables": {"companies": [{"name": "NovaAI", "roles": 4, "eligible": 132}, {"name": "Cloudlane", "roles": 6, "eligible": 210}]},
        "notifications": [{"title": "Drive readiness", "message": "Cloudlane shortlist closes Friday.", "type": "info"}],
        "predictions": [{"type": "PLACEMENT", "score": 84, "result": "Strong hiring window"}],
        "recommendations": ["Run resume clinics for the 120 borderline students", "Invite analytics recruiters for CSE and ECE cohorts"],
    }
