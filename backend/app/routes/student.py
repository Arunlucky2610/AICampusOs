import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.notification import Notification
from app.models.prediction import Prediction, Roadmap, Skill
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.student import StudentProfileRead, StudentProfileUpdate

router = APIRouter(prefix="/student", tags=["student"])

UPLOAD_DIR = Path("uploads/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

settings = get_settings()


def _get_or_create_student(db: Session, user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        student = Student(
            user_id=user.id,
            roll_number=f"TEMP-{user.id}",
            department="Not Set",
            year=1,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student


@router.get("/profile", response_model=StudentProfileRead)
def get_student_profile(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    return _get_or_create_student(db, current_user)


@router.put("/profile", response_model=StudentProfileRead)
def update_student_profile(
    body: StudentProfileUpdate,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = _get_or_create_student(db, current_user)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


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


@router.get("/dashboard")
def student_dashboard(
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = _get_or_create_student(db, current_user)
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).limit(5).all()
    predictions = db.query(Prediction).filter(Prediction.student_id == student.id).limit(5).all() if student else []
    skills = db.query(Skill).filter(Skill.student_id == student.id).all() if student else []
    roadmaps = db.query(Roadmap).filter(Roadmap.student_id == student.id).all() if student else []

    has_real_data = bool(student.cgpa or student.attendance_percentage or student.placement_readiness_score)

    profile = {
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
