from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.dependencies.auth import require_roles
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.faculty import StudentFullProfile

router = APIRouter(prefix="/placement", tags=["placement"])


def _build_student_summary(s: Student, db: Session) -> dict:
    user = db.query(User).filter(User.id == s.user_id).first()
    name = user.full_name if user else "Unknown"
    email = user.email if user else ""
    skills = s.skills_data or {}
    top_skills = []
    for cat in ["programming_languages", "frameworks", "ai_skills"]:
        top_skills.extend(skills.get(cat, [])[:2])
    return {
        "id": s.id,
        "name": name,
        "email": email,
        "roll_number": s.roll_number,
        "department": s.department,
        "year": s.year,
        "section": s.section,
        "cgpa": s.cgpa,
        "topSkills": top_skills[:3],
        "resumeScore": s.resume_score,
        "codingScore": s.coding_score,
        "communicationScore": s.communication_score,
        "mockInterviewScore": s.mock_interview_score,
        "placementReadiness": s.placement_readiness_score,
        "eligibleCompanies": s.eligible_companies,
        "applicationStatus": "Eligible" if s.placement_readiness_score > 60 else "Needs Improvement",
        "profile_photo_url": s.profile_photo_url,
    }


@router.get("/dashboard")
def placement_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN])),
):
    students = db.query(Student).all()
    total = len(students)
    eligible = len([s for s in students if s.placement_readiness_score >= 60])
    placed = len([s for s in students if s.offers > 0])
    at_risk = len([s for s in students if s.risk_score > 50])
    avg_attendance = sum(s.attendance_percentage for s in students) / total if total else 0
    avg_cgpa = sum(s.cgpa for s in students) / total if total else 0

    return {
        "role": "PLACEMENT_OFFICER",
        "totalEligibleStudents": eligible,
        "placementReadyStudents": len([s for s in students if s.placement_readiness_score >= 75]),
        "shortlistedStudents": len([s for s in students if s.placement_readiness_score >= 80]),
        "placedStudents": placed,
        "activeDrives": 8,
        "averagePackage": 12.5,
        "highestPackage": 42,
        "companiesVisiting": 45,
        "totalStudents": total,
        "firstYearStudents": len([s for s in students if s.year == 1]),
        "secondYearStudents": len([s for s in students if s.year == 2]),
        "thirdYearStudents": len([s for s in students if s.year == 3]),
        "fourthYearStudents": len([s for s in students if s.year == 4]),
        "atRiskStudents": at_risk,
        "averageAttendance": avg_attendance,
        "averageCgpa": avg_cgpa,
        "pendingAssignments": 42,
        "charts": {
            "yearDistribution": [
                {"year": "1st Year", "count": len([s for s in students if s.year == 1])},
                {"year": "2nd Year", "count": len([s for s in students if s.year == 2])},
                {"year": "3rd Year", "count": len([s for s in students if s.year == 3])},
                {"year": "4th Year", "count": len([s for s in students if s.year == 4])},
            ],
            "placementFunnel": [{"stage": "Eligible", "count": eligible}, {"stage": "Registered", "count": int(eligible * 0.8)}, {"stage": "Shortlisted", "count": int(eligible * 0.6)}, {"stage": "Interviewed", "count": int(eligible * 0.45)}, {"stage": "Selected", "count": int(eligible * 0.3)}, {"stage": "Offered", "count": placed}],
            "departmentComparison": [
                {"dept": dept, "placed": len([s for s in students if s.department == dept and s.offers > 0]), "eligible": len([s for s in students if s.department == dept and s.placement_readiness_score >= 60])}
                for dept in set(s.department for s in students)
            ],
            "packageDistribution": [{"range": "3-6 LPA", "count": 12}, {"range": "6-10 LPA", "count": 18}, {"range": "10-15 LPA", "count": 16}, {"range": "15-25 LPA", "count": 10}, {"range": "25+ LPA", "count": 6}],
        },
        "notifications": [
            {"title": "Google Hiring Drive", "message": "Google visiting campus on July 20.", "type": "info"},
            {"title": "Infosys Eligibility", "message": "37 students match Infosys criteria.", "type": "warning"},
        ],
    }


@router.get("/students")
def placement_students(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN])),
):
    students = db.query(Student).all()
    return [_build_student_summary(s, db) for s in students]


@router.get("/students/{student_id}")
def placement_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN, UserRole.FACULTY])),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.routes.faculty import _build_student_dict, _patch_fallback_for_schema
    data = _build_student_dict(student, user)
    return _patch_fallback_for_schema(data)


@router.get("/departments")
def placement_departments(_: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]))):
    return [
        {"department": "CSE", "totalStudents": 68, "eligibleStudents": 55, "placementReady": 48, "placementReadyPercent": 87,
         "avgCgpa": 8.2, "avgResumeScore": 76, "topSkills": ["Python", "DSA", "Java"], "placedCount": 22, "avgPackage": 16.5},
        {"department": "AIML", "totalStudents": 55, "eligibleStudents": 48, "placementReady": 42, "placementReadyPercent": 88,
         "avgCgpa": 8.5, "avgResumeScore": 80, "topSkills": ["Python", "AI/ML", "TensorFlow"], "placedCount": 18, "avgPackage": 18.2},
        {"department": "AIDS", "totalStudents": 40, "eligibleStudents": 32, "placementReady": 28, "placementReadyPercent": 88,
         "avgCgpa": 8.0, "avgResumeScore": 72, "topSkills": ["Python", "SQL", "AI/ML"], "placedCount": 12, "avgPackage": 14.0},
        {"department": "ECE", "totalStudents": 38, "eligibleStudents": 28, "placementReady": 20, "placementReadyPercent": 71,
         "avgCgpa": 7.5, "avgResumeScore": 65, "topSkills": ["C++", "Python", "IoT"], "placedCount": 8, "avgPackage": 11.0},
    ]


@router.get("/companies")
def placement_companies(_: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]))):
    return [
        {"id": 1, "name": "Google", "role": "SDE", "requiredCgpa": 8.0,
         "requiredSkills": ["DSA", "Python", "System Design"], "allowedDepartments": ["CSE", "AIML"],
         "backlogPolicy": "No active backlogs", "package": "42 LPA", "eligibleStudents": 38, "status": "upcoming"},
        {"id": 2, "name": "Amazon", "role": "SDE", "requiredCgpa": 7.0,
         "requiredSkills": ["DSA", "Java", "System Design"], "allowedDepartments": ["CSE", "AIML", "AIDS", "ECE"],
         "backlogPolicy": "Max 2 backlogs", "package": "28 LPA", "eligibleStudents": 68, "status": "active"},
        {"id": 3, "name": "Infosys", "role": "Systems Engineer", "requiredCgpa": 6.5,
         "requiredSkills": ["Python", "Java", "SQL"], "allowedDepartments": ["CSE", "AIML", "AIDS", "ECE", "EEE"],
         "backlogPolicy": "Max 3 backlogs", "package": "8 LPA", "eligibleStudents": 95, "status": "active"},
    ]


@router.get("/drives")
def placement_drives(_: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]))):
    return [
        {"id": 1, "company": "TCS", "role": "Digital", "date": "2026-07-10", "eligible": 120, "registered": 98,
         "shortlisted": 75, "selected": 28, "offers": 22, "package": "7.5 LPA", "status": "completed"},
        {"id": 2, "company": "Infosys", "role": "Systems Engineer", "date": "2026-07-15", "eligible": 95, "registered": 82,
         "shortlisted": 60, "selected": 0, "offers": 0, "package": "8 LPA", "status": "active"},
        {"id": 3, "company": "Amazon", "role": "SDE", "date": "2026-08-01", "eligible": 68, "registered": 55,
         "shortlisted": 0, "selected": 0, "offers": 0, "package": "28 LPA", "status": "active"},
    ]


@router.get("/analytics")
def placement_analytics(_: User = Depends(require_roles([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]))):
    return {
        "skills": [
            {"skill": "Python", "studentCount": 210, "companyDemand": 38, "gapPercent": 18, "recommendedAction": "Advanced Python workshops"},
            {"skill": "Java", "studentCount": 180, "companyDemand": 32, "gapPercent": 22, "recommendedAction": "Intermediate Java training"},
            {"skill": "React", "studentCount": 120, "companyDemand": 22, "gapPercent": 35, "recommendedAction": "React bootcamp"},
            {"skill": "AI/ML", "studentCount": 95, "companyDemand": 28, "gapPercent": 42, "recommendedAction": "ML specialization track"},
            {"skill": "DSA", "studentCount": 150, "companyDemand": 35, "gapPercent": 25, "recommendedAction": "DSA practice sessions"},
            {"skill": "Cloud", "studentCount": 85, "companyDemand": 20, "gapPercent": 48, "recommendedAction": "Cloud certification program"},
        ],
        "pipeline": {"eligible": 245, "registered": 198, "shortlisted": 145, "interviewed": 112, "selected": 76, "offered": 62, "joined": 55},
    }
