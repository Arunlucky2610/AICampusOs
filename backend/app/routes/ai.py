import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.student import Student
from app.models.user import User
from app.services.ai_prompts import list_modules
from app.services.ai_router import AIRouter, get_latest_result
from app.services.ai_service import assistant_reply, career_recommendation, learning_roadmap, placement_prediction, resume_analysis, risk_prediction, skill_gap

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class AssistantRequest(BaseModel):
    message: str


class RunAIRequest(BaseModel):
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None


def _student(db: Session) -> Student:
    return db.query(Student).first()


# ── Legacy heuristic endpoints (kept for backward compatibility) ──

@router.get("/placement-prediction")
def placement(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return placement_prediction(_student(db))


@router.get("/risk-prediction")
def risk(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return risk_prediction(_student(db))


@router.get("/skill-gap")
def skills(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return skill_gap(_student(db))


@router.post("/resume-analysis")
def resume(_: User = Depends(get_current_user)):
    return resume_analysis()


@router.get("/career-recommendation")
def career(_: User = Depends(get_current_user)):
    return career_recommendation()


@router.get("/learning-roadmap")
def roadmap(_: User = Depends(get_current_user)):
    return learning_roadmap()


@router.post("/assistant")
def assistant(payload: AssistantRequest, _: User = Depends(get_current_user)):
    return assistant_reply(payload.message)


# ── New AI Infrastructure Endpoints ──

@router.post("/run/{module_type}")
def run_ai_module(
    module_type: str,
    payload: Optional[RunAIRequest] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        router_instance = AIRouter(module_type, db, user)

        if payload and payload.system_prompt and payload.user_prompt:
            result = router_instance.execute_raw(
                payload.system_prompt, payload.user_prompt
            )
        else:
            result = router_instance.execute()

        return result

    except ValueError as exc:
        logger.warning("User error in run_ai_module: %s", exc)
        return {
            "atsScore": 0, "resumeStrengthScore": 0, "skillsMatch": 0,
            "projectImpact": 0, "experienceQuality": 0,
            "missingKeywords": [], "weakSections": [], "corrections": [],
            "improvedSummary": "", "strengths": [], "weaknesses": [],
            "evidenceFromData": [], "exactWeakAreas": [],
            "improvementPlan": [], "nextActions": [],
            "missingData": [],
            "error": str(exc),
            "error_type": "missing_data",
        }
    except RuntimeError as exc:
        logger.warning("Runtime error in run_ai_module: %s", exc)
        return {
            "atsScore": 0, "resumeStrengthScore": 0, "skillsMatch": 0,
            "projectImpact": 0, "experienceQuality": 0,
            "missingKeywords": [], "weakSections": [], "corrections": [],
            "improvedSummary": "", "strengths": [], "weaknesses": [],
            "evidenceFromData": [], "exactWeakAreas": [],
            "improvementPlan": [], "nextActions": [],
            "missingData": [],
            "error": "Temporary AI service issue. Please retry.",
            "error_type": "service_unavailable",
        }
    except Exception as exc:
        logger.exception("Unexpected error in run_ai_module")
        return {
            "atsScore": 0, "resumeStrengthScore": 0, "skillsMatch": 0,
            "projectImpact": 0, "experienceQuality": 0,
            "missingKeywords": [], "weakSections": [], "corrections": [],
            "improvedSummary": "", "strengths": [], "weaknesses": [],
            "evidenceFromData": [], "exactWeakAreas": [],
            "improvementPlan": [], "nextActions": [],
            "missingData": [],
            "error": "Temporary AI service issue. Please retry.",
            "error_type": "unknown",
        }


@router.get("/latest/{module_type}")
def get_latest_ai_result(
    module_type: str,
    user: User = Depends(get_current_user),
):
    result = get_latest_result(user.id, module_type)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cached result found for module '{module_type}'. Run the module first via POST /api/ai/run/{module_type}.",
        )
    return result


@router.get("/modules")
def list_available_modules(
    _: User = Depends(get_current_user),
):
    return {"modules": list_modules()}
