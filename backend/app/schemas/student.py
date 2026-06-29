from datetime import date

from pydantic import BaseModel


class StudentProfileRead(BaseModel):
    id: int
    roll_number: str
    department: str
    year: int
    cgpa: float
    attendance_percentage: float
    placement_readiness_score: float
    risk_score: float
    skill_score: float

    model_config = {"from_attributes": True}


class RoadmapRead(BaseModel):
    id: int
    title: str
    description: str
    status: str
    due_date: date | None

    model_config = {"from_attributes": True}
