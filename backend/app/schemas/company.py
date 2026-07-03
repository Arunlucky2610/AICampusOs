from typing import Any

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class CompanyRead(BaseModel):
    id: int
    name: str
    role: str
    required_cgpa: float
    required_skills: list[str] = []
    allowed_departments: list[str] = []
    backlog_policy: str = "No restrictions"
    package: str = ""
    drive_date: str | None = None
    status: str = "upcoming"
    eligible_students: int = 0
    min_resume_score: float | None = 0.0
    min_coding_score: float | None = 0.0
    min_mock_interview_score: float | None = 0.0
    description: str | None = None

    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)


class CompanyCreate(BaseModel):
    name: str
    role: str
    required_cgpa: float = 0.0
    required_skills: list[str] = []
    allowed_departments: list[str] = []
    backlog_policy: str = "No restrictions"
    package: str = ""
    drive_date: str | None = None
    status: str = "upcoming"
    min_resume_score: float | None = 0.0
    min_coding_score: float | None = 0.0
    min_mock_interview_score: float | None = 0.0
    description: str | None = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CompanyUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    required_cgpa: float | None = None
    required_skills: list[str] | None = None
    allowed_departments: list[str] | None = None
    backlog_policy: str | None = None
    package: str | None = None
    drive_date: str | None = None
    status: str | None = None
    min_resume_score: float | None = None
    min_coding_score: float | None = None
    min_mock_interview_score: float | None = None
    description: str | None = None

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class StudentEligibilityResult(BaseModel):
    company_id: int
    company_name: str
    role: str
    package: str
    drive_date: str | None = None
    status: str
    eligible: bool
    reasons: list[str] = []
    match_score: float = 0.0
    criteria_met: dict[str, bool] = {}

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
