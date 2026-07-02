from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


_NUMERIC_FIELDS = [
    "cgpa", "current_semester_gpa", "attendance_percentage",
    "credits_earned", "total_credits",
    "placement_readiness_score", "risk_score",
    "skill_score", "resume_score", "coding_score",
    "mock_interview_score", "communication_score",
    "applications", "eligible_companies", "offers",
]


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class StudentProfileRead(BaseModel):
    id: int
    user_id: int
    roll_number: str
    registration_number: str | None = None
    department: str
    course: str | None = "B.Tech"
    branch: str | None = None
    section: str | None = None
    year: int
    semester: int | None = None
    academic_year: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    address: str | None = None
    profile_photo_url: str | None = None
    cgpa: float | None = None
    current_semester_gpa: float | None = None
    attendance_percentage: float | None = None
    credits_earned: int | None = None
    total_credits: int = 180
    faculty_advisor: str | None = None
    placement_readiness_score: float | None = None
    risk_score: float | None = None
    skill_score: float | None = None
    resume_score: float | None = None
    coding_score: float | None = None
    mock_interview_score: float | None = None
    communication_score: float | None = None
    applications: int | None = None
    eligible_companies: int | None = None
    offers: int | None = None
    preferred_role: str | None = None
    expected_package: str | None = None
    semester_gpas: list[dict[str, Any]] = []
    subjects_data: list[dict[str, Any]] = []
    skills_data: dict[str, list[str]] = {}
    certifications: list[str] = []
    eligible_companies_list: list[dict[str, Any]] = []
    applied_companies_list: list[dict[str, Any]] = []
    github_url: str | None = None
    linkedin_url: str | None = None
    leetcode_url: str | None = None
    portfolio_url: str | None = None
    resume_url: str | None = None
    resume_text: str | None = None
    linkedin_headline: str | None = None
    linkedin_about: str | None = None
    linkedin_skills: str | None = None
    linkedin_open_to_work: bool = False
    parent_name: str | None = None
    parent_phone: str | None = None
    parent_email: str | None = None

    @model_validator(mode="before")
    @classmethod
    def zero_is_none(cls, data: Any) -> Any:
        for field in _NUMERIC_FIELDS:
            val = getattr(data, field, None) if not isinstance(data, dict) else data.get(field)
            if val in (0, 0.0):
                if isinstance(data, dict):
                    data[field] = None
                else:
                    setattr(data, field, None)
        return data

    @field_validator("semester_gpas", "subjects_data", "certifications", "eligible_companies_list", "applied_companies_list", mode="before")
    @classmethod
    def ensure_list(cls, v: Any) -> list:
        if isinstance(v, dict):
            return list(v.values()) if v else []
        if v is None:
            return []
        return v if isinstance(v, list) else []

    @model_validator(mode="after")
    @classmethod
    def ensure_defaults(cls, data: Any) -> Any:
        if data.total_credits is None or data.total_credits == 0:
            data.total_credits = 180
        return data

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class StudentProfileUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    roll_number: str | None = None
    registration_number: str | None = None
    department: str | None = None
    course: str | None = None
    branch: str | None = None
    section: str | None = None
    year: int | None = None
    semester: int | None = None
    academic_year: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    address: str | None = None
    profile_photo_url: str | None = None
    cgpa: float | None = None
    current_semester_gpa: float | None = None
    attendance_percentage: float | None = None
    credits_earned: int | None = None
    total_credits: int | None = None
    faculty_advisor: str | None = None
    placement_readiness_score: float | None = None
    risk_score: float | None = None
    skill_score: float | None = None
    resume_score: float | None = None
    coding_score: float | None = None
    mock_interview_score: float | None = None
    communication_score: float | None = None
    applications: int | None = None
    eligible_companies: int | None = None
    offers: int | None = None
    preferred_role: str | None = None
    expected_package: str | None = None
    semester_gpas: list[dict[str, Any]] | None = None
    subjects_data: list[dict[str, Any]] | None = None
    skills_data: dict[str, list[str]] | None = None
    certifications: list[str] | None = None
    eligible_companies_list: list[dict[str, Any]] | None = None
    applied_companies_list: list[dict[str, Any]] | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    leetcode_url: str | None = None
    portfolio_url: str | None = None
    resume_url: str | None = None
    resume_text: str | None = None
    linkedin_headline: str | None = None
    linkedin_about: str | None = None
    linkedin_skills: str | None = None
    linkedin_open_to_work: bool | None = None
    parent_name: str | None = None
    parent_phone: str | None = None
    parent_email: str | None = None

    @model_validator(mode="before")
    @classmethod
    def map_legacy_profile_keys(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        aliases = {
            "photo": "profile_photo_url",
            "profilePhoto": "profile_photo_url",
            "profilePhotoUrl": "profile_photo_url",
            "name": "full_name",
            "fullName": "full_name",
            "roll": "roll_number",
            "rollNumber": "roll_number",
            "regNo": "registration_number",
            "registrationNumber": "registration_number",
            "dept": "department",
            "sem": "semester",
            "sgpa": "current_semester_gpa",
            "currentSgpa": "current_semester_gpa",
            "currentSemesterGpa": "current_semester_gpa",
            "attendance": "attendance_percentage",
            "attendancePercentage": "attendance_percentage",
            "creditsEarned": "credits_earned",
            "facultyAdvisor": "faculty_advisor",
            "skills": "skills_data",
            "skillsData": "skills_data",
            "githubUrl": "github_url",
            "leetcodeUrl": "leetcode_url",
            "linkedinUrl": "linkedin_url",
            "parentName": "parent_name",
            "parentPhone": "parent_phone",
            "parentEmail": "parent_email",
        }
        normalized = dict(data)
        for source, target in aliases.items():
            if source in normalized and target not in normalized:
                normalized[target] = normalized[source]
        return normalized

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class RoadmapRead(BaseModel):
    id: int
    title: str
    description: str
    status: str
    due_date: date | None

    model_config = {"from_attributes": True}
