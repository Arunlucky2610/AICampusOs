from typing import Any

from pydantic import BaseModel


class FacultyProfileRead(BaseModel):
    id: int
    user_id: int
    employee_id: str | None = None
    department: str
    designation: str
    phone: str | None = None
    subject_handling: list[str] = []
    assigned_years: list[int] = []
    assigned_sections: list[str] = []
    class_advisor: bool = False
    office_room: str | None = None
    experience: float = 0.0
    profile_picture: str | None = None

    model_config = {"from_attributes": True}


class FacultyProfileUpdate(BaseModel):
    employee_id: str | None = None
    department: str | None = None
    designation: str | None = None
    phone: str | None = None
    subject_handling: list[str] | None = None
    assigned_years: list[int] | None = None
    assigned_sections: list[str] | None = None
    class_advisor: bool | None = None
    office_room: str | None = None
    experience: float | None = None
    profile_picture: str | None = None


class FacultyDashboardResponse(BaseModel):
    role: str
    profile: dict[str, Any]
    kpis: list[dict[str, Any]]
    charts: dict[str, Any]
    recent_students: list[dict[str, Any]]
    notifications: list[dict[str, Any]]


class FacultyStudentListItem(BaseModel):
    id: int
    user_id: int
    name: str
    roll_number: str
    registration_number: str | None = None
    department: str
    year: int
    section: str | None = None
    semester: int | None = None
    cgpa: float
    attendance_percentage: float
    risk_score: float
    placement_readiness_score: float
    profile_picture: str | None = None
    ai_score: int = 0


class StudentFullProfile(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    roll_number: str
    registration_number: str | None = None
    department: str
    course: str | None = None
    branch: str | None = None
    section: str | None = None
    year: int
    semester: int | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    phone_number: str | None = None
    address: str | None = None
    parent_name: str | None = None
    parent_phone: str | None = None
    parent_email: str | None = None
    profile_photo_url: str | None = None
    cgpa: float = 0.0
    current_semester_gpa: float = 0.0
    attendance_percentage: float = 0.0
    credits_earned: int = 0
    total_credits: int = 180
    faculty_advisor: str | None = None
    placement_readiness_score: float = 0.0
    risk_score: float = 0.0
    skill_score: float = 0.0
    resume_score: float = 0.0
    coding_score: float = 0.0
    mock_interview_score: float = 0.0
    communication_score: float = 0.0
    applications: int = 0
    eligible_companies: int = 0
    offers: int = 0
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
    backlogs: list[str] = []
    monthly_attendance: list[dict[str, Any]] = []
    assignment_completion: dict[str, Any] = {}
    strengths: list[str] = []
    weak_areas: list[str] = []
    recommended_action: str = ""
    intervention_notes: list[str] = []
    profile_picture: str | None = None
    ai_score: int = 0
    projects: list[dict[str, Any]] = []
    hackathons: list[dict[str, Any]] = []
    coding_profile: dict[str, Any] | None = None
    behavior_notes: list[str] = []
    parent_details: dict[str, Any] = {}
    faculty_notes: list[dict[str, Any]] = []
    timeline: list[dict[str, Any]] = []
    ai_summary: dict[str, Any] = {}
