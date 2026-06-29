from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.student import Student
from app.models.user import User
from app.services.ai_service import assistant_reply, career_recommendation, learning_roadmap, placement_prediction, resume_analysis, risk_prediction, skill_gap

router = APIRouter(prefix="/ai", tags=["ai"])


class AssistantRequest(BaseModel):
    message: str


def _student(db: Session) -> Student:
    return db.query(Student).first()


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
