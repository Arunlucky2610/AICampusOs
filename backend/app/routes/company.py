import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.company import Company
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate, StudentEligibilityResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])

SEED_COMPANIES = [
    {"name": "TCS", "role": "Digital", "required_cgpa": 6.0, "required_skills": ["Python", "Java", "SQL"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE", "CIVIL", "MECH"], "backlog_policy": "No restrictions", "package": "7.5 LPA", "drive_date": "2026-07-10", "status": "active", "min_resume_score": 40, "min_coding_score": 40, "min_mock_interview_score": 35},
    {"name": "Infosys", "role": "Systems Engineer", "required_cgpa": 6.5, "required_skills": ["Python", "Java", "SQL"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE"], "backlog_policy": "Max 3 backlogs", "package": "8 LPA", "drive_date": "2026-07-15", "status": "active", "min_resume_score": 50, "min_coding_score": 50, "min_mock_interview_score": 45},
    {"name": "Wipro", "role": "Project Engineer", "required_cgpa": 6.0, "required_skills": ["Python", "Java", "SQL"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE"], "backlog_policy": "Max 2 backlogs", "package": "6.5 LPA", "drive_date": "2026-07-20", "status": "active", "min_resume_score": 40, "min_coding_score": 35, "min_mock_interview_score": 35},
    {"name": "Accenture", "role": "ASE", "required_cgpa": 6.0, "required_skills": ["Python", "Java", "SQL", "Communication"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE"], "backlog_policy": "Max 2 backlogs", "package": "9 LPA", "drive_date": "2026-08-15", "status": "active", "min_resume_score": 45, "min_coding_score": 45, "min_mock_interview_score": 40},
    {"name": "Deloitte", "role": "Analyst", "required_cgpa": 7.0, "required_skills": ["SQL", "Python", "Excel", "Communication"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE"], "backlog_policy": "Max 1 backlog", "package": "12 LPA", "drive_date": "2026-08-20", "status": "upcoming", "min_resume_score": 55, "min_coding_score": 50, "min_mock_interview_score": 50},
    {"name": "Amazon", "role": "SDE", "required_cgpa": 7.0, "required_skills": ["DSA", "Java", "System Design"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE"], "backlog_policy": "Max 2 backlogs", "package": "28 LPA", "drive_date": "2026-08-01", "status": "active", "min_resume_score": 60, "min_coding_score": 65, "min_mock_interview_score": 60},
    {"name": "Microsoft", "role": "SWE", "required_cgpa": 7.5, "required_skills": ["DSA", "C++", "Python"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE"], "backlog_policy": "Max 1 backlog", "package": "35 LPA", "drive_date": "2026-07-25", "status": "upcoming", "min_resume_score": 65, "min_coding_score": 70, "min_mock_interview_score": 65},
    {"name": "Google", "role": "SDE", "required_cgpa": 8.0, "required_skills": ["DSA", "Python", "System Design"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE"], "backlog_policy": "No active backlogs", "package": "42 LPA", "drive_date": "2026-07-20", "status": "upcoming", "min_resume_score": 70, "min_coding_score": 75, "min_mock_interview_score": 70},
    {"name": "Capgemini", "role": "Software Engineer", "required_cgpa": 6.0, "required_skills": ["Java", "Python", "SQL"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE"], "backlog_policy": "Max 3 backlogs", "package": "7 LPA", "drive_date": "2026-08-10", "status": "active", "min_resume_score": 35, "min_coding_score": 35, "min_mock_interview_score": 30},
    {"name": "Cognizant", "role": "Programmer Analyst", "required_cgpa": 6.0, "required_skills": ["Java", "Python", "SQL"], "allowed_departments": ["CSE", "AIML", "AIDS", "ECE", "EEE"], "backlog_policy": "Max 2 backlogs", "package": "6.5 LPA", "drive_date": "2026-08-25", "status": "upcoming", "min_resume_score": 35, "min_coding_score": 30, "min_mock_interview_score": 30},
]


def _ensure_companies_seeded(db: Session) -> bool:
    count = db.query(Company).count()
    if count > 0:
        return False
    for data in SEED_COMPANIES:
        db.add(Company(**data))
    db.commit()
    logger.info("Seeded %d companies into the database", len(SEED_COMPANIES))
    return True


def _compute_eligibility(company: Company, student: Student) -> dict[str, Any]:
    reasons: list[str] = []
    criteria_met: dict[str, bool] = {}

    cgpa = student.cgpa or 0
    cgpa_met = cgpa >= company.required_cgpa
    criteria_met["cgpa"] = cgpa_met
    if not cgpa_met:
        reasons.append(f"CGPA {cgpa:.2f} < required {company.required_cgpa:.2f}")

    DEPT_ACRONYMS = {
        "CSE": ["COMPUTER SCIENCE AND ENGINEERING", "COMPUTER SCIENCE & ENGINEERING", "COMPUTER SCIENCE"],
        "AIML": ["ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING", "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", "ARTIFICIAL INTELLIGENCE"],
        "AIDS": ["ARTIFICIAL INTELLIGENCE AND DATA SCIENCE", "ARTIFICIAL INTELLIGENCE & DATA SCIENCE", "ARTIFICIAL INTELLIGENCE AND DATA SCIENCES"],
        "ECE": ["ELECTRONICS AND COMMUNICATION ENGINEERING", "ELECTRONICS & COMMUNICATION ENGINEERING", "ELECTRONICS AND COMMUNICATIONS"],
        "EEE": ["ELECTRICAL AND ELECTRONICS ENGINEERING", "ELECTRICAL & ELECTRONICS ENGINEERING", "ELECTRICAL ENGINEERING"],
        "CIVIL": ["CIVIL ENGINEERING"],
        "MECH": ["MECHANICAL ENGINEERING"],
        "IT": ["INFORMATION TECHNOLOGY"],
    }
    dept_met = not company.allowed_departments
    if not dept_met:
        student_dept = (student.department or "").upper().replace(" ", "")
        dept_met = any(
            d.upper().replace(" ", "") == student_dept or
            d.upper() in (student.department or "").upper() or
            (student.department or "").upper().startswith(d.upper()) or
            any(expansion.replace(" ", "") == student_dept for expansion in DEPT_ACRONYMS.get(d.upper(), []))
            for d in company.allowed_departments
        )
    criteria_met["department"] = dept_met
    if not dept_met:
        allowed = ", ".join(company.allowed_departments or [])
        reasons.append(f"Department '{student.department}' not in allowed ({allowed})")

    skills_data = student.skills_data or {}
    all_skills = set()
    for cat in ["programming_languages", "frameworks", "ai_skills", "soft_skills"]:
        for s in skills_data.get(cat, []):
            all_skills.add(s.lower())
    needed = set(s.lower() for s in (company.required_skills or []))
    common = all_skills & needed if needed else set()
    skills_met = not needed or len(common) >= max(1, len(needed) * 0.5)
    criteria_met["skills"] = skills_met
    if not skills_met:
        missing = needed - all_skills
        reasons.append(f"Missing skills: {', '.join(sorted(missing)[:4])}")

    resume_met = True
    if company.min_resume_score and company.min_resume_score > 0:
        resume_met = (student.resume_score or 0) >= company.min_resume_score
        criteria_met["resume"] = resume_met
        if not resume_met:
            reasons.append(f"Resume score {(student.resume_score or 0):.0f} < required {company.min_resume_score:.0f}")

    coding_met = True
    if company.min_coding_score and company.min_coding_score > 0:
        coding_met = (student.coding_score or 0) >= company.min_coding_score
        criteria_met["coding"] = coding_met
        if not coding_met:
            reasons.append(f"Coding score {(student.coding_score or 0):.0f} < required {company.min_coding_score:.0f}")

    mock_met = True
    if company.min_mock_interview_score and company.min_mock_interview_score > 0:
        mock_met = (student.mock_interview_score or 0) >= company.min_mock_interview_score
        criteria_met["mock_interview"] = mock_met
        if not mock_met:
            reasons.append(f"Mock interview score {(student.mock_interview_score or 0):.0f} < required {company.min_mock_interview_score:.0f}")

    eligible = all([cgpa_met, dept_met, skills_met, resume_met, coding_met, mock_met])

    met_count = sum(1 for v in criteria_met.values() if v)
    total = max(len(criteria_met), 1)
    match_score = round((met_count / total) * 100, 1)

    return {
        "eligible": eligible,
        "reasons": reasons,
        "match_score": match_score,
        "criteria_met": criteria_met,
    }


# ─── STATIC ROUTES FIRST (before parameterized routes) ───


@router.get("/eligibility/mine", response_model=list[StudentEligibilityResult])
def my_eligibility(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db),
):
    _ensure_companies_seeded(db)
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    companies = db.query(Company).all()
    results: list[StudentEligibilityResult] = []
    for c in companies:
        info = _compute_eligibility(c, student)
        results.append(StudentEligibilityResult(
            company_id=c.id,
            company_name=c.name,
            role=c.role,
            package=c.package,
            drive_date=c.drive_date,
            status=c.status,
            eligible=info["eligible"],
            reasons=info["reasons"],
            match_score=info["match_score"],
            criteria_met=info["criteria_met"],
        ))

    eligible_count = sum(1 for r in results if r.eligible)
    if student.eligible_companies != eligible_count:
        student.eligible_companies = eligible_count
        db.commit()

    results.sort(key=lambda r: r.match_score, reverse=True)
    return results


@router.get("", response_model=list[CompanyRead])
def list_companies(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN, UserRole.FACULTY, UserRole.STUDENT])),
):
    _ensure_companies_seeded(db)
    companies = db.query(Company).all()
    result = []
    for c in companies:
        data = CompanyRead.model_validate(c).model_dump(by_alias=True)
        data["eligibleStudents"] = sum(1 for s in db.query(Student).all() if _compute_eligibility(c, s)["eligible"])
        result.append(data)
    return result


@router.post("", response_model=CompanyRead)
def create_company(
    body: CompanyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN])),
):
    c = Company(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# ─── PARAMETERIZED ROUTES LAST ───


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN, UserRole.FACULTY, UserRole.STUDENT])),
):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    data = CompanyRead.model_validate(c).model_dump(by_alias=True)
    data["eligibleStudents"] = sum(1 for s in db.query(Student).all() if _compute_eligibility(c, s)["eligible"])
    return data


@router.put("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: int,
    body: CompanyUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN])),
):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(c, key, val)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN])),
):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
    return {"detail": "Company deleted"}
