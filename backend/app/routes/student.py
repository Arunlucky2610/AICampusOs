import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.coding_progress import CodingProgressCache
from app.models.notification import Notification
from app.models.prediction import Prediction, Roadmap, Skill
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.coding_progress import (
    CodingProgressResponse,
    CodingProgressSyncResponse,
    CodingSummary,
    GitHubStats,
    LeetCodeStats,
    LinkedInProfileInfo,
    LinkedInStatus,
)
from app.schemas.student import StudentProfileRead, StudentProfileUpdate
from app.services.coding_service import (
    calculate_coding_score,
    calculate_placement_readiness,
    extract_github_username,
    extract_leetcode_username,
    fetch_github_stats,
    fetch_leetcode_stats,
)
from app.services.resume_service import extract_text_from_file

router = APIRouter(prefix="/student", tags=["student"])

UPLOAD_DIR = Path("uploads/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

RESUME_UPLOAD_DIR = Path("uploads/resumes")
RESUME_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
RESUME_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024  # 10MB

settings = get_settings()
logger = logging.getLogger(__name__)


STUDENT_COLUMN_TYPES: dict[str, str] = {
    "registration_number": "VARCHAR(40)",
    "course": "VARCHAR(120)",
    "branch": "VARCHAR(120)",
    "section": "VARCHAR(10)",
    "semester": "INTEGER",
    "academic_year": "VARCHAR(20)",
    "date_of_birth": "VARCHAR(20)",
    "gender": "VARCHAR(20)",
    "phone_number": "VARCHAR(20)",
    "address": "TEXT",
    "profile_photo_url": "VARCHAR(500)",
    "cgpa": "FLOAT",
    "current_semester_gpa": "FLOAT",
    "attendance_percentage": "FLOAT",
    "credits_earned": "INTEGER",
    "total_credits": "INTEGER",
    "faculty_advisor": "VARCHAR(120)",
    "placement_readiness_score": "FLOAT",
    "risk_score": "FLOAT",
    "skill_score": "FLOAT",
    "resume_score": "FLOAT",
    "coding_score": "FLOAT",
    "mock_interview_score": "FLOAT",
    "communication_score": "FLOAT",
    "applications": "INTEGER",
    "eligible_companies": "INTEGER",
    "offers": "INTEGER",
    "preferred_role": "VARCHAR(100)",
    "expected_package": "VARCHAR(50)",
    "semester_gpas": "JSONB",
    "subjects_data": "JSONB",
    "skills_data": "JSONB",
    "certifications": "JSONB",
    "eligible_companies_list": "JSONB",
    "applied_companies_list": "JSONB",
    "github_url": "VARCHAR(500)",
    "linkedin_url": "VARCHAR(500)",
    "leetcode_url": "VARCHAR(500)",
    "portfolio_url": "VARCHAR(500)",
    "resume_url": "VARCHAR(500)",
    "resume_text": "TEXT",
    "linkedin_headline": "VARCHAR(300)",
    "linkedin_about": "TEXT",
    "linkedin_skills": "VARCHAR(500)",
    "linkedin_open_to_work": "INTEGER",
    "parent_name": "VARCHAR(160)",
    "parent_phone": "VARCHAR(20)",
    "parent_email": "VARCHAR(255)",
}

STUDENT_DEFAULTS: dict[str, Any] = {
    "course": "B.Tech",
    "cgpa": 0,
    "current_semester_gpa": 0,
    "attendance_percentage": 0,
    "credits_earned": 0,
    "total_credits": 180,
    "placement_readiness_score": 0,
    "risk_score": 0,
    "skill_score": 0,
    "resume_score": 0,
    "coding_score": 0,
    "mock_interview_score": 0,
    "communication_score": 0,
    "applications": 0,
    "eligible_companies": 0,
    "offers": 0,
    "semester_gpas": [],
    "subjects_data": [],
    "skills_data": {},
    "certifications": [],
    "eligible_companies_list": [],
    "applied_companies_list": [],
    "linkedin_open_to_work": 0,
}


def _json_column_type(db: Session) -> str:
    return "JSONB" if db.bind and db.bind.dialect.name == "postgresql" else "JSON"


def _bool_to_int(val: bool | None) -> int | None:
    if val is None:
        return None
    return 1 if val else 0


def _ensure_students_columns(db: Session) -> set[str]:
    inspector = inspect(db.bind)
    if "students" not in inspector.get_table_names():
        Student.__table__.create(bind=db.bind, checkfirst=True)
        db.commit()
        inspector = inspect(db.bind)

    existing = {col["name"] for col in inspector.get_columns("students")}
    missing = [name for name in STUDENT_COLUMN_TYPES if name not in existing]
    if missing:
        try:
            for name in missing:
                column_type = STUDENT_COLUMN_TYPES[name]
                if column_type == "JSONB":
                    column_type = _json_column_type(db)
                db.execute(text(f"ALTER TABLE students ADD COLUMN {name} {column_type}"))
                logger.info("Added missing students.%s column", name)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Failed adding missing students columns")
            raise
    return {col["name"] for col in inspect(db.bind).get_columns("students")}


def _student_model_columns() -> set[str]:
    return {prop.key for prop in Student.__mapper__.column_attrs}


def _apply_student_defaults(student: Student) -> None:
    for key, value in STUDENT_DEFAULTS.items():
        if getattr(student, key, None) is None:
            setattr(student, key, value.copy() if isinstance(value, (dict, list)) else value)


def _get_or_create_student(db: Session, user: User) -> Student:
    _ensure_students_columns(db)
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        student = _create_student_row(db, user)
    else:
        _apply_student_defaults(student)
    return student


def _create_student_row(db: Session, user: User) -> Student:
    for attempt in range(3):
        try:
            temp_roll = f"TEMP-{user.id}-{uuid.uuid4().hex[:8]}"
            student = Student(
                user_id=user.id,
                roll_number=temp_roll,
                department="Not Set",
                year=1,
                course="B.Tech",
                cgpa=0.0,
                current_semester_gpa=0.0,
                attendance_percentage=0.0,
                credits_earned=0,
                total_credits=180,
                skills_data={},
                semester_gpas=[],
                subjects_data=[],
                certifications=[],
                eligible_companies_list=[],
                applied_companies_list=[],
                linkedin_open_to_work=0,
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            return student
        except SQLAlchemyError:
            db.rollback()
            logger.warning("Attempt %d: failed to create student for user_id=%s", attempt + 1, user.id)
    raise HTTPException(status_code=500, detail="Unable to create student profile")


def _compute_skill_score(skills_data: dict | None) -> float:
    skills = skills_data or {}
    total = 0
    for v in skills.values():
        if isinstance(v, list):
            total += len(v)
    return min(total * 8, 100)  # each skill = 8pts, max 100


def _auto_sync_and_calculate_scores(
    db: Session,
    student: Student,
    cache: CodingProgressCache,
) -> None:
    github_username = extract_github_username(student.github_url)
    leetcode_username = extract_leetcode_username(student.leetcode_url)
    has_linkedin = bool(student.linkedin_url)

    github_stats_data = {}
    leetcode_stats_data = {}
    if github_username:
        try:
            github_stats_data = fetch_github_stats(github_username)
        except Exception:
            logger.exception("Failed to fetch GitHub stats for %s", github_username)
    if leetcode_username:
        try:
            leetcode_stats_data = fetch_leetcode_stats(leetcode_username)
        except Exception:
            logger.exception("Failed to fetch LeetCode stats for %s", leetcode_username)

    coding_score = calculate_coding_score(leetcode_stats_data, github_stats_data, has_linkedin)
    skill_score = _compute_skill_score(student.skills_data)
    resume_score = 50 if student.resume_url else 0

    profile_completion = _compute_profile_completion(student)
    linkedin_strength = _compute_linkedin_profile_strength(student)
    lc_total = leetcode_stats_data.get("total_solved", 0)
    if not isinstance(lc_total, (int, float)):
        lc_total = 0

    placement_readiness_score = calculate_placement_readiness(
        lc_total, coding_score, resume_score, profile_completion, linkedin_strength,
    )

    student.coding_score = coding_score
    student.skill_score = skill_score
    student.resume_score = resume_score
    student.placement_readiness_score = placement_readiness_score
    student.risk_score = max(0, 100 - placement_readiness_score)
    student.communication_score = min(linkedin_strength, 100)
    student.mock_interview_score = min(round(placement_readiness_score * 0.85), 100)

    cache.github_username = github_username
    cache.leetcode_username = leetcode_username
    cache.github_stats_json = github_stats_data
    cache.leetcode_stats_json = leetcode_stats_data
    cache.coding_score = coding_score
    cache.placement_readiness_score = placement_readiness_score
    cache.last_synced_at = datetime.utcnow()


def _get_or_create_coding_progress_cache(db: Session, user: User) -> CodingProgressCache:
    cache = db.query(CodingProgressCache).filter(CodingProgressCache.user_id == user.id).first()
    if not cache:
        cache = CodingProgressCache(user_id=user.id)
        db.add(cache)
        db.commit()
        db.refresh(cache)
    return cache


@router.get("/profile", response_model=StudentProfileRead)
def get_student_profile(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    try:
        student = _get_or_create_student(db, current_user)
        db.commit()
        db.refresh(student)
        return student
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("GET /student/profile failed for user_id=%s", current_user.id)
        raise HTTPException(status_code=500, detail={"message": "Unable to load student profile", "error": str(exc)})
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected GET /student/profile failure for user_id=%s", current_user.id)
        raise HTTPException(status_code=500, detail={"message": "Unable to load student profile", "error": str(exc)})


@router.put("/profile", response_model=StudentProfileRead)
def update_student_profile(
    body: StudentProfileUpdate,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    try:
        update_data = body.model_dump(exclude_unset=True)
        logger.debug("PUT /student/profile update_data keys=%s", sorted(update_data.keys()))

        user_updated = False
        if update_data.get("full_name"):
            current_user.full_name = update_data["full_name"]
            user_updated = True
        if update_data.get("email"):
            current_user.email = update_data["email"]
            user_updated = True
        if user_updated:
            db.add(current_user)

        student = _get_or_create_student(db, current_user)
        model_columns = _student_model_columns()
        _PROTECTED = {"id", "user_id", "created_at", "updated_at"}

        ignored = sorted(k for k in update_data if k in _PROTECTED or (k not in model_columns and k not in ("full_name", "email")))
        if ignored:
            logger.info("Ignoring protected/unknown student profile fields: %s", ignored)

        for key, val in update_data.items():
            if key in _PROTECTED or key in ("full_name", "email") or key not in model_columns:
                continue
            if key == "total_credits" and val is None:
                continue
            if key == "linkedin_open_to_work":
                converted = _bool_to_int(val)
                if converted is None:
                    continue
                setattr(student, key, converted)
            else:
                setattr(student, key, val)

        has_coding_urls = bool(student.github_url or student.leetcode_url)
        if has_coding_urls:
            try:
                cache = _get_or_create_coding_progress_cache(db, current_user)
                _auto_sync_and_calculate_scores(db, student, cache)
            except Exception:
                logger.exception("Auto-sync failed after profile update for user_id=%s", current_user.id)

        db.add(student)
        db.commit()
        db.refresh(student)
        return student
    except SQLAlchemyError:
        db.rollback()
        logger.exception("PUT /student/profile SQL failure for user_id=%s", current_user.id)
        raise HTTPException(status_code=500, detail="Unable to save student profile")
    except Exception:
        db.rollback()
        logger.exception("Unexpected PUT /student/profile failure for user_id=%s", current_user.id)
        raise HTTPException(status_code=500, detail="Unable to save student profile")


@router.post("/profile/photo")
def upload_profile_photo(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
    photo: UploadFile = File(...),
):
    ext = Path(photo.filename).suffix.lower() if photo.filename else ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP files are allowed")

    contents = photo.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 2MB allowed")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/profile_photos/{filename}"

    student = _get_or_create_student(db, current_user)
    student.profile_photo_url = photo_url
    db.commit()

    return {"profile_photo_url": photo_url}


@router.post("/resume/upload")
def upload_resume(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
    resume: UploadFile = File(...),
):
    ext = Path(resume.filename).suffix.lower() if resume.filename else ".txt"
    if ext not in RESUME_ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT files are allowed")

    contents = resume.file.read()
    if len(contents) > MAX_RESUME_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = RESUME_UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(contents)

    try:
        resume_text = extract_text_from_file(str(filepath))
    except Exception as exc:
        filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Failed to extract text from resume: {exc}")

    student = _get_or_create_student(db, current_user)
    student.resume_text = resume_text
    student.resume_url = f"/uploads/resumes/{filename}"
    db.commit()

    return {
        "resume_url": student.resume_url,
        "resume_text_length": len(resume_text),
        "message": "Resume uploaded and text extracted successfully",
    }


def _compute_profile_completion(student: Student) -> float:
    checks = [
        bool(student.github_url),
        bool(student.linkedin_url),
        bool(student.leetcode_url),
        bool(student.roll_number) and student.roll_number != f"TEMP-{student.user_id}",
        bool(student.department) and student.department != "Not Set",
        bool(student.resume_score),
        bool(student.skill_score),
        bool(student.coding_score),
    ]
    filled = sum(1 for c in checks if c)
    return round((filled / len(checks)) * 100, 1)


def _extract_linkedin_username(url: str | None) -> str | None:
    if not url:
        return None
    import re
    m = re.match(r"https?://(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)/?$", url.strip())
    return m.group(1) if m else None


def _compute_linkedin_profile_strength(student: Student) -> int:
    score = 0
    if student.linkedin_url:
        score += 30
    if student.linkedin_headline:
        score += 25
    if student.linkedin_about:
        score += 25
    if student.linkedin_skills:
        score += 20
    return min(score, 100)


def _build_linkedin_profile_info(student: Student) -> LinkedInProfileInfo:
    username = _extract_linkedin_username(student.linkedin_url)
    return LinkedInProfileInfo(
        username=username,
        headline=student.linkedin_headline,
        about=student.linkedin_about,
        skills=student.linkedin_skills,
        open_to_work=bool(student.linkedin_open_to_work),
        profile_strength=_compute_linkedin_profile_strength(student),
    )


@router.get("/coding-progress", response_model=CodingProgressResponse)
def get_coding_progress(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = _get_or_create_student(db, current_user)
    cache = _get_or_create_coding_progress_cache(db, current_user)

    github_url = student.github_url
    leetcode_url = student.leetcode_url
    linkedin_url = student.linkedin_url

    github_username = extract_github_username(github_url)
    leetcode_username = extract_leetcode_username(leetcode_url)

    linkedin_profile = _build_linkedin_profile_info(student)

    if cache.last_synced_at:
        return CodingProgressResponse(
            github_url=github_url,
            leetcode_url=leetcode_url,
            linkedin_url=linkedin_url,
            github_username=cache.github_username,
            leetcode_username=cache.leetcode_username,
            github_stats=GitHubStats(**cache.github_stats_json) if cache.github_stats_json else None,
            leetcode_stats=LeetCodeStats(**cache.leetcode_stats_json) if cache.leetcode_stats_json else None,
            linkedin_status=LinkedInStatus(**cache.linkedin_status_json) if cache.linkedin_status_json else None,
            linkedin_profile=linkedin_profile,
            coding_score=cache.coding_score or 0,
            placement_readiness_score=cache.placement_readiness_score or 0,
            last_synced_at=cache.last_synced_at.isoformat() if cache.last_synced_at else None,
        )

    return CodingProgressResponse(
        github_url=github_url,
        leetcode_url=leetcode_url,
        linkedin_url=linkedin_url,
        github_username=github_username,
        leetcode_username=leetcode_username,
        github_stats=None,
        leetcode_stats=None,
        linkedin_status=LinkedInStatus(connected=bool(linkedin_url), url=linkedin_url),
        linkedin_profile=linkedin_profile,
        coding_score=0,
        placement_readiness_score=0,
        last_synced_at=None,
    )


@router.post("/coding-progress/sync", response_model=CodingProgressSyncResponse)
def sync_coding_progress(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = _get_or_create_student(db, current_user)
    cache = _get_or_create_coding_progress_cache(db, current_user)

    github_username = extract_github_username(student.github_url)
    leetcode_username = extract_leetcode_username(student.leetcode_url)

    if not github_username and not leetcode_username and not student.linkedin_url:
        return CodingProgressSyncResponse(
            success=False,
            message="Connect your GitHub, LeetCode, or LinkedIn in Profile first",
            data=None,
        )

    github_stats_data = {}
    leetcode_stats_data = {}

    if github_username:
        github_stats_data = fetch_github_stats(github_username)
    elif cache.github_stats_json:
        github_stats_data = cache.github_stats_json

    if leetcode_username:
        leetcode_stats_data = fetch_leetcode_stats(leetcode_username)
    elif cache.leetcode_stats_json:
        leetcode_stats_data = cache.leetcode_stats_json

    github_stats_obj = GitHubStats(**github_stats_data) if github_stats_data else None
    leetcode_stats_obj = LeetCodeStats(**leetcode_stats_data) if leetcode_stats_data else None

    has_linkedin = bool(student.linkedin_url)
    linkedin_status = LinkedInStatus(connected=has_linkedin, url=student.linkedin_url)
    linkedin_profile = _build_linkedin_profile_info(student)

    coding_score = calculate_coding_score(
        leetcode_stats_data or {},
        github_stats_data or {},
        has_linkedin,
    )

    profile_completion = _compute_profile_completion(student)
    lc_total = (leetcode_stats_data or {}).get("total_solved", 0)
    if isinstance(lc_total, int):
        pass
    else:
        lc_total = 0

    linkedin_strength = _compute_linkedin_profile_strength(student)

    placement_readiness_score = calculate_placement_readiness(
        lc_total,
        coding_score,
        student.resume_score,
        profile_completion,
        linkedin_strength,
    )

    cache.github_username = github_username
    cache.leetcode_username = leetcode_username
    cache.github_stats_json = github_stats_data
    cache.leetcode_stats_json = leetcode_stats_data
    cache.linkedin_status_json = linkedin_status.model_dump()
    cache.coding_score = coding_score
    cache.placement_readiness_score = placement_readiness_score
    cache.last_synced_at = datetime.utcnow()
    db.commit()
    db.refresh(cache)

    return CodingProgressSyncResponse(
        success=True,
        message="Coding progress synced successfully",
        data=CodingProgressResponse(
            github_url=student.github_url,
            leetcode_url=student.leetcode_url,
            linkedin_url=student.linkedin_url,
            github_username=github_username,
            leetcode_username=leetcode_username,
            github_stats=github_stats_obj,
            leetcode_stats=leetcode_stats_obj,
            linkedin_status=linkedin_status,
            linkedin_profile=linkedin_profile,
            coding_score=coding_score,
            placement_readiness_score=placement_readiness_score,
            last_synced_at=cache.last_synced_at.isoformat() if cache.last_synced_at else None,
        ),
    )


@router.get("/coding-progress/summary", response_model=CodingSummary)
def get_coding_summary(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    cache = _get_or_create_coding_progress_cache(db, current_user)
    leetcode_stats = cache.leetcode_stats_json or {}
    github_stats = cache.github_stats_json or {}
    return CodingSummary(
        leetcode_total_solved=leetcode_stats.get("total_solved", 0),
        github_public_repos=github_stats.get("public_repos", 0),
        github_recent_activity=github_stats.get("recent_activity_count", 0),
        coding_score=cache.coding_score or 0,
        placement_readiness_score=cache.placement_readiness_score or 0,
        last_synced_at=cache.last_synced_at.isoformat() if cache.last_synced_at else None,
    )


@router.get("/dashboard")
def student_dashboard(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = _get_or_create_student(db, current_user)
    cache = _get_or_create_coding_progress_cache(db, current_user)
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).limit(5).all()
    predictions = db.query(Prediction).filter(Prediction.student_id == student.id).limit(5).all() if student else []
    skills = db.query(Skill).filter(Skill.student_id == student.id).all() if student else []
    roadmaps = db.query(Roadmap).filter(Roadmap.student_id == student.id).all() if student else []

    has_real_data = bool(student.cgpa or student.attendance_percentage or student.placement_readiness_score)

    leetcode_stats = cache.leetcode_stats_json or {}
    github_stats = cache.github_stats_json or {}

    profile = {
        "profile_photo_url": student.profile_photo_url,
        "department": student.department,
        "year": student.year,
        "roll_number": student.roll_number,
        "current_semester": student.semester or student.year * 2,
        "cgpa": student.cgpa,
        "attendance_percentage": student.attendance_percentage,
        "placement_readiness_score": student.placement_readiness_score,
        "resume_score": student.resume_score,
        "coding_score": student.coding_score,
        "skill_score": student.skill_score,
        "communication_score": student.communication_score,
        "credits_earned": student.credits_earned,
        "total_credits": student.total_credits,
        "current_semester_gpa": student.current_semester_gpa,
        "semester_gpas": student.semester_gpas or [],
        "subjects_data": student.subjects_data or [],
        "skills_data": student.skills_data or {},
        "applications": student.applications,
        "eligible_companies": student.eligible_companies,
        "offers": student.offers,
        "mock_interview_score": student.mock_interview_score,
        "section": student.section,
        "branch": student.branch,
        "faculty_advisor": student.faculty_advisor,
        "preferred_role": student.preferred_role,
    }

    coding_summary = {
        "leetcode_total_solved": leetcode_stats.get("total_solved", 0),
        "github_public_repos": github_stats.get("public_repos", 0),
        "github_recent_activity": github_stats.get("recent_activity_count", 0),
        "coding_score": cache.coding_score or student.coding_score or 0,
        "placement_readiness_score": cache.placement_readiness_score or student.placement_readiness_score or 0,
        "last_synced_at": cache.last_synced_at.isoformat() if cache.last_synced_at else None,
    }

    if not has_real_data:
        overall = {
            "successScore": 0,
            "placementReadiness": 0,
            "academicRisk": "Unknown",
            "aiConfidence": 0,
            "nextBestAction": "Complete your profile to unlock accurate AI insights.",
        }
        kpis = [
            {"label": "CGPA", "value": "Complete profile", "trend": "", "progress": 0},
            {"label": "Attendance", "value": "Complete profile", "trend": "", "progress": 0},
            {"label": "Placement Readiness", "value": "Complete profile", "trend": "", "progress": 0},
            {"label": "Skill Score", "value": "Complete profile", "trend": "", "progress": 0},
            {"label": "Resume Score", "value": "Complete profile", "trend": "", "progress": 0},
            {"label": "Risk Score", "value": "Unknown", "trend": "", "progress": 0},
        ]
    else:
        overall = {
            "successScore": round(student.cgpa * 10, 1) if student.cgpa else 0,
            "placementReadiness": student.placement_readiness_score or 0,
            "academicRisk": "Low" if student.risk_score < 30 else "Medium" if student.risk_score < 60 else "High",
            "aiConfidence": 94,
            "nextBestAction": "Complete system design learning sprint this week.",
        }
        kpis = [
            {"label": "CGPA", "value": str(student.cgpa) if student.cgpa else "0", "trend": "+0.3" if student.cgpa else "", "progress": int(student.cgpa * 10) if student.cgpa else 0},
            {"label": "Attendance", "value": f"{student.attendance_percentage:.0f}%" if student.attendance_percentage else "0%", "trend": "+4%" if student.attendance_percentage else "", "progress": int(student.attendance_percentage) if student.attendance_percentage else 0},
            {"label": "Placement Readiness", "value": f"{student.placement_readiness_score:.0f}%" if student.placement_readiness_score else "0%", "trend": "+8%" if student.placement_readiness_score else "", "progress": int(student.placement_readiness_score) if student.placement_readiness_score else 0},
            {"label": "Skill Score", "value": f"{student.skill_score:.0f}%" if student.skill_score else "0%", "trend": "+6%" if student.skill_score else "", "progress": int(student.skill_score) if student.skill_score else 0},
            {"label": "Resume Score", "value": f"{student.resume_score:.0f}%" if student.resume_score else "0%", "trend": "+12%" if student.resume_score else "", "progress": int(student.resume_score) if student.resume_score else 0},
            {"label": "Risk Score", "value": "Low" if student.risk_score < 30 else "Medium", "trend": "-6%" if student.risk_score < 30 else "+2%", "progress": int(student.risk_score) if student.risk_score else 0},
        ]

    return {
        "role": "STUDENT",
        "user": {"full_name": current_user.full_name, "email": current_user.email},
        "profile": profile,
        "overall": overall,
        "kpis": kpis,
        "coding_summary": coding_summary,
        "charts": {
            "performanceTrend": [
                {"month": "Jan", "cgpa": 7.8, "attendance": 82, "readiness": 54},
                {"month": "Feb", "cgpa": 8.0, "attendance": 86, "readiness": 62},
                {"month": "Mar", "cgpa": 8.2, "attendance": 88, "readiness": 68},
                {"month": "Apr", "cgpa": 8.4, "attendance": 91, "readiness": 78},
                {"month": "May", "cgpa": 8.45, "attendance": 92, "readiness": 78},
                {"month": "Jun", "cgpa": 8.45, "attendance": 92, "readiness": 78},
            ],
            "skillRadar": [
                {"skill": "Python", "score": 85},
                {"skill": "Java", "score": 70},
                {"skill": "React", "score": 78},
                {"skill": "FastAPI", "score": 72},
                {"skill": "SQL", "score": 80},
                {"skill": "AI/ML", "score": 68},
            ],
            "skillGap": [
                {"skill": "Python", "current": 85, "target": 92},
                {"skill": "Java", "current": 70, "target": 82},
                {"skill": "React", "current": 78, "target": 88},
                {"skill": "FastAPI", "current": 72, "target": 85},
                {"skill": "SQL", "current": 80, "target": 90},
                {"skill": "AI/ML", "current": 68, "target": 82},
            ],
            "weeklyActivity": [
                {"week": "W1", "hours": 12, "tasks": 8},
                {"week": "W2", "hours": 15, "tasks": 10},
                {"week": "W3", "hours": 18, "tasks": 12},
                {"week": "W4", "hours": 14, "tasks": 9},
                {"week": "W5", "hours": 20, "tasks": 14},
                {"week": "W6", "hours": 16, "tasks": 11},
            ],
            "riskTimeline": [
                {"event": "Low attendance warning resolved", "date": "2 days ago", "type": "resolved"},
                {"event": "Resume improved", "date": "5 days ago", "type": "positive"},
                {"event": "Mock interview pending", "date": "Tomorrow", "type": "pending"},
                {"event": "Internship application due", "date": "In 3 days", "type": "warning"},
            ],
        },
        "recommendations": [
            {"title": "Complete System Design Sprint", "priority": "High", "reason": "Improves backend readiness and interview score.", "action": "Start Sprint"},
            {"title": "Book One Mock Interview", "priority": "Medium", "reason": "Placement readiness can improve by 12%.", "action": "Book Now"},
            {"title": "Improve AI/ML Skill Level", "priority": "Medium", "reason": "Your target role requires stronger ML basics.", "action": "View Course"},
            {"title": "Update Resume Projects Section", "priority": "High", "reason": "Resume score is currently 81%.", "action": "Update Resume"},
        ],
        "roadmap": [
            {"step": "Strengthen DSA Basics", "completed": 100, "status": "done"},
            {"step": "Complete FastAPI Backend Project", "completed": 75, "status": "in_progress"},
            {"step": "Build Resume Projects", "completed": 60, "status": "in_progress"},
            {"step": "Mock Interviews", "completed": 30, "status": "pending"},
            {"step": "Apply for Internships", "completed": 10, "status": "pending"},
            {"step": "Placement Ready", "completed": 0, "status": "pending"},
        ],
        "placementReadiness": {
            "resumeQuality": student.resume_score or 0,
            "mockInterviewScore": student.mock_interview_score or 0,
            "technicalSkills": student.skill_score or 0,
            "communication": student.communication_score or 0,
            "projectStrength": 88,
        },
        "activities": [
            {"action": "Resume analyzed", "timestamp": "2 hours ago", "type": "analysis"},
            {"action": "Skill gap report generated", "timestamp": "1 day ago", "type": "report"},
            {"action": "Roadmap updated", "timestamp": "2 days ago", "type": "update"},
            {"action": "Placement prediction refreshed", "timestamp": "3 days ago", "type": "prediction"},
            {"action": "New AI recommendation created", "timestamp": "4 days ago", "type": "ai"},
        ],
        "tables": {"roadmap": [{"title": r.title, "status": r.status, "dueDate": str(r.due_date)} for r in roadmaps]},
        "notifications": [{"title": n.title, "message": n.message, "type": n.type} for n in notifications],
        "predictions": [{"type": p.prediction_type, "score": p.score, "result": p.result, "explanation": p.explanation} for p in predictions],
    }
