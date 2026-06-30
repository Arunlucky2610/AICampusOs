from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.faculty import FacultyProfile
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.faculty import (
    FacultyDashboardResponse,
    FacultyProfileRead,
    FacultyProfileUpdate,
    FacultyStudentListItem,
    StudentFullProfile,
)

router = APIRouter(prefix="/faculty", tags=["faculty"])


def _faculty_profile(db: Session, user: User) -> FacultyProfile:
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
    if not profile and user.role == UserRole.FACULTY:
        profile = FacultyProfile(
            user_id=user.id,
            department="AIML",
            designation="Assistant Professor",
            employee_id="FAC-2023-0042",
            phone="+91-9876543210",
            subject_handling=["Machine Learning", "Deep Learning", "Neural Networks", "Python Programming"],
            assigned_years=[1, 2, 3, 4],
            assigned_sections=["A", "B"],
            class_advisor=True,
            office_room="Block C, Room 301",
            experience=8.0,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/profile", response_model=FacultyProfileRead)
def get_faculty_profile(
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    return _faculty_profile(db, current_user)


@router.put("/profile", response_model=FacultyProfileRead)
def update_faculty_profile(
    body: FacultyProfileUpdate,
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    profile = _faculty_profile(db, current_user)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def _build_student_dict(s: Student, user: User) -> dict:
    return {
        "id": s.id,
        "user_id": s.user_id,
        "name": user.full_name,
        "email": user.email,
        "roll_number": s.roll_number,
        "registration_number": s.registration_number,
        "department": s.department,
        "course": s.course,
        "branch": s.branch,
        "section": s.section,
        "year": s.year,
        "semester": s.semester,
        "date_of_birth": s.date_of_birth,
        "gender": s.gender,
        "phone_number": s.phone_number,
        "address": s.address,
        "profile_photo_url": s.profile_photo_url,
        "parent_name": s.parent_name,
        "parent_phone": s.parent_phone,
        "parent_email": s.parent_email,
        "cgpa": s.cgpa,
        "current_semester_gpa": s.current_semester_gpa,
        "attendance_percentage": s.attendance_percentage,
        "credits_earned": s.credits_earned,
        "total_credits": s.total_credits,
        "faculty_advisor": s.faculty_advisor,
        "placement_readiness_score": s.placement_readiness_score,
        "risk_score": s.risk_score,
        "skill_score": s.skill_score,
        "resume_score": s.resume_score,
        "coding_score": s.coding_score,
        "mock_interview_score": s.mock_interview_score,
        "communication_score": s.communication_score,
        "applications": s.applications,
        "eligible_companies": s.eligible_companies,
        "offers": s.offers,
        "preferred_role": s.preferred_role,
        "expected_package": s.expected_package,
        "semester_gpas": s.semester_gpas or [],
        "subjects_data": s.subjects_data or [],
        "skills_data": s.skills_data or {},
        "certifications": s.certifications or [],
        "eligible_companies_list": s.eligible_companies_list or [],
        "applied_companies_list": s.applied_companies_list or [],
        "github_url": s.github_url,
        "linkedin_url": s.linkedin_url,
        "leetcode_url": s.leetcode_url,
        "portfolio_url": s.portfolio_url,
        "resume_url": s.resume_url,
        "profile_picture": s.profile_photo_url,
    }


def _db_students(db: Session) -> list[dict]:
    students = db.query(Student).all()
    result = []
    for s in students:
        user = db.query(User).filter(User.id == s.user_id).first()
        if user:
            result.append(_build_student_dict(s, user))
    return result


@router.get("/dashboard")
def faculty_dashboard(
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    profile = _faculty_profile(db, current_user)
    all_students = _db_students(db)

    if not all_students:
        all_students = _generate_fallback_students()

    total = len(all_students)
    year1 = len([s for s in all_students if s["year"] == 1])
    year2 = len([s for s in all_students if s["year"] == 2])
    year3 = len([s for s in all_students if s["year"] == 3])
    year4 = len([s for s in all_students if s["year"] == 4])
    at_risk = len([s for s in all_students if s["risk_score"] > 50])
    avg_attendance = sum(s["attendance_percentage"] for s in all_students) / total if total else 0
    pending_assignments = sum(
        s.get("assignment_completion", {}).get("pending", 0) for s in all_students
    )

    year_labels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    year_data = [year1, year2, year3, year4]

    recent = sorted(all_students, key=lambda x: -x.get("id", 0))[:8]

    kpis = [
        {"label": "Total Students", "value": total, "trend": "+5" if total else "0", "progress": 100},
        {"label": "1st Year Students", "value": year1, "trend": "+2", "progress": int(year1 / total * 100) if total else 0},
        {"label": "2nd Year Students", "value": year2, "trend": "+1", "progress": int(year2 / total * 100) if total else 0},
        {"label": "3rd Year Students", "value": year3, "trend": "+1", "progress": int(year3 / total * 100) if total else 0},
        {"label": "4th Year Students", "value": year4, "trend": "0", "progress": int(year4 / total * 100) if total else 0},
        {"label": "At-Risk Students", "value": at_risk, "trend": f"-{at_risk // 3}" if at_risk else "0", "progress": int(at_risk / total * 100) if total else 0},
        {"label": "Average Attendance", "value": f"{avg_attendance:.0f}%", "trend": "+2%", "progress": int(avg_attendance)},
        {"label": "Pending Assignments", "value": pending_assignments, "trend": "-8", "progress": 65},
    ]

    return {
        "role": "FACULTY",
        "profile": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "employee_id": profile.employee_id,
            "department": profile.department,
            "designation": profile.designation,
            "phone": profile.phone,
            "subject_handling": profile.subject_handling,
            "assigned_years": profile.assigned_years,
            "assigned_sections": profile.assigned_sections,
            "class_advisor": profile.class_advisor,
            "office_room": profile.office_room,
            "experience": profile.experience,
        },
        "kpis": kpis,
        "charts": {
            "yearDistribution": [{"year": year_labels[i], "count": year_data[i]} for i in range(4)],
            "riskDistribution": [
                {"name": "Low Risk", "value": len([s for s in all_students if s["risk_score"] < 30]), "color": "#22C55E"},
                {"name": "Medium Risk", "value": len([s for s in all_students if 30 <= s["risk_score"] < 60]), "color": "#F59E0B"},
                {"name": "High Risk", "value": len([s for s in all_students if s["risk_score"] >= 60]), "color": "#EF4444"},
            ],
            "attendanceTrend": [
                {"month": "Jul", "percentage": 84},
                {"month": "Aug", "percentage": 86},
                {"month": "Sep", "percentage": 83},
                {"month": "Oct", "percentage": 88},
                {"month": "Nov", "percentage": 85},
                {"month": "Dec", "percentage": 90},
            ],
            "cgpaDistribution": [
                {"range": "6-7 CGPA", "count": len([s for s in all_students if 6 <= s["cgpa"] < 7])},
                {"range": "7-8 CGPA", "count": len([s for s in all_students if 7 <= s["cgpa"] < 8])},
                {"range": "8-9 CGPA", "count": len([s for s in all_students if 8 <= s["cgpa"] < 9])},
                {"range": "9-10 CGPA", "count": len([s for s in all_students if s["cgpa"] >= 9])},
            ],
        },
        "recent_students": [
            {"id": s["id"], "name": s["name"], "roll_number": s["roll_number"], "year": s["year"], "section": s["section"], "cgpa": s["cgpa"], "attendance": s["attendance_percentage"], "risk": "Low" if s["risk_score"] < 30 else "Medium" if s["risk_score"] < 60 else "High", "readiness": s["placement_readiness_score"]}
            for s in recent
        ],
        "notifications": [
            {"title": "Assignment Deadline", "message": "ML assignment submission due tomorrow for 3rd Year A section.", "type": "warning"},
            {"title": "At-Risk Alert", "message": "5 students in 2nd Year B section have attendance below 75%.", "type": "error"},
            {"title": "Mentor Review", "message": "Weekly mentor review pending for 12 students.", "type": "info"},
            {"title": "Exam Schedule", "message": "Mid-semester exams starting next month. Please submit question papers.", "type": "info"},
        ],
    }


@router.get("/students", response_model=list[FacultyStudentListItem])
def list_students(
    year: int | None = Query(None),
    section: str | None = Query(None),
    department: str | None = Query(None),
    semester: int | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    all_students = _db_students(db)
    if not all_students:
        all_students = _generate_fallback_students()

    filtered = list(all_students)
    if year:
        filtered = [s for s in filtered if s["year"] == year]
    if section:
        filtered = [s for s in filtered if s["section"] == section]
    if department:
        filtered = [s for s in filtered if s["department"] == department]
    if semester:
        filtered = [s for s in filtered if s["semester"] == semester]
    if search:
        q = search.lower()
        filtered = [s for s in filtered if q in s["name"].lower() or q in s["roll_number"].lower()]

    return [
        {
            "id": s["id"],
            "user_id": s["user_id"],
            "name": s["name"],
            "roll_number": s["roll_number"],
            "registration_number": s["registration_number"],
            "department": s["department"],
            "year": s["year"],
            "section": s["section"],
            "semester": s["semester"],
            "cgpa": s["cgpa"],
            "attendance_percentage": s["attendance_percentage"],
            "risk_score": s["risk_score"],
            "placement_readiness_score": s["placement_readiness_score"],
            "profile_picture": s.get("profile_picture") or s.get("profile_photo_url"),
            "ai_score": 0,
        }
        for s in filtered
    ]


@router.get("/students/{student_id}", response_model=StudentFullProfile)
def get_student_detail(
    student_id: int,
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        all_students = _generate_fallback_students()
        for s in all_students:
            if s["id"] == student_id:
                return _patch_fallback_for_schema(s)
        raise HTTPException(status_code=404, detail="Student not found")

    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = _build_student_dict(student, user)
    return _patch_fallback_for_schema(data)


@router.get("/year-wise")
def year_wise_summary(
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    all_students = _db_students(db)
    if not all_students:
        all_students = _generate_fallback_students()

    years = []
    for year in range(1, 5):
        ys = [s for s in all_students if s["year"] == year]
        if not ys:
            continue
        years.append({
            "year": year,
            "label": f"{year}st Year" if year == 1 else f"{year}nd Year" if year == 2 else f"{year}rd Year" if year == 3 else f"{year}th Year",
            "total_students": len(ys),
            "average_attendance": round(sum(s["attendance_percentage"] for s in ys) / len(ys), 1),
            "average_cgpa": round(sum(s["cgpa"] for s in ys) / len(ys), 2),
            "at_risk_count": len([s for s in ys if s["risk_score"] > 50]),
        })
    return years


@router.get("/at-risk")
def at_risk_students(
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    all_students = _db_students(db)
    if not all_students:
        all_students = _generate_fallback_students()

    at_risk = [s for s in all_students if s["risk_score"] > 40]
    at_risk.sort(key=lambda s: -s["risk_score"])
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "roll_number": s["roll_number"],
            "year": s["year"],
            "section": s["section"],
            "cgpa": s["cgpa"],
            "attendance_percentage": s["attendance_percentage"],
            "risk_score": s["risk_score"],
            "weak_areas": s.get("weak_areas", []),
            "recommended_action": s.get("recommended_action", ""),
        }
        for s in at_risk[:20]
    ]


def _patch_fallback_for_schema(data: dict) -> dict:
    """Ensure fallback data has all fields expected by StudentFullProfile schema."""
    extras = {
        "backlogs": data.get("backlogs", []),
        "monthly_attendance": data.get("monthly_attendance", []),
        "assignment_completion": data.get("assignment_completion", {"total": 0, "submitted": 0, "pending": 0}),
        "strengths": data.get("strengths", []),
        "weak_areas": data.get("weak_areas", []),
        "recommended_action": data.get("recommended_action", ""),
        "intervention_notes": data.get("intervention_notes", []),
        "profile_picture": data.get("profile_picture"),
        "ai_score": data.get("ai_score", 0),
    }
    data.update(extras)
    return data


def _generate_fallback_students() -> list[dict]:
    """Generate fallback mock data when no DB students exist."""
    departments = ["AIML", "CSE", "ECE", "IT"]
    sections = ["A", "B", "C"]
    first_names = [
        "Anika", "Arjun", "Bhavya", "Chirag", "Deepika", "Esha", "Farhan", "Gauri",
        "Harsh", "Ishita", "Jatin", "Kavya", "Lakshya", "Manya", "Naman", "Ojas",
        "Pranav", "Qadir", "Riya", "Sahil", "Tanvi", "Uday", "Vaishnavi", "Yash",
        "Zara", "Aarav", "Bhavna", "Chandan", "Divya", "Ekansh",
    ]
    last_names = [
        "Sharma", "Verma", "Patel", "Reddy", "Singh", "Gupta", "Kumar", "Rao",
        "Joshi", "Mehta", "Nair", "Iyer", "Desai", "Menon", "Pillai",
    ]
    subjects_by_year = {
        1: ["Mathematics I", "Physics", "Chemistry", "Programming Fundamentals", "English"],
        2: ["Data Structures", "Algorithms", "Database Systems", "Computer Networks", "Operating Systems"],
        3: ["Machine Learning", "Deep Learning", "AI", "Cloud Computing", "Cyber Security"],
        4: ["Natural Language Processing", "Computer Vision", "Blockchain", "DevOps", "Research Methodology"],
    }

    students = []
    for year in range(1, 5):
        for section in sections[:2]:
            count = 6 if year == 1 else 7 if year == 2 else 6 if year == 3 else 6
            for i in range(count):
                first = first_names[(year * 10 + i) % len(first_names)]
                last = last_names[(year * 7 + i) % len(last_names)]
                dept = departments[(year + i) % len(departments)]
                cgpa = round(5.5 + (hash(first + last) % 35) / 10, 2)
                attendance = 70 + (hash(last + first) % 25)
                risk = "Low" if cgpa > 7.5 and attendance > 85 else "Medium" if cgpa > 6.0 else "High"
                risk_score = 15 if risk == "Low" else 45 if risk == "Medium" else 75
                readiness = min(95, max(30, int(cgpa * 8 + attendance * 0.2 - 20)))

                students.append({
                    "id": (year - 1) * 100 + i + 1,
                    "user_id": (year - 1) * 100 + i + 1,
                    "name": f"{first} {last}",
                    "email": f"{first.lower()}.{last.lower()}@campus.edu",
                    "roll_number": f"{dept}{year}{chr(65 + i % 2)}{(i + 1):02d}",
                    "registration_number": f"REG-{2024 - year + 1}-{(i + 1):04d}",
                    "department": dept,
                    "course": "B.Tech",
                    "branch": dept,
                    "section": section,
                    "year": year,
                    "semester": year * 2 - 1,
                    "date_of_birth": f"20{(2006 - year + 1)}-{(i % 12 + 1):02d}-{(i % 28 + 1):02d}",
                    "gender": "Female" if i % 2 == 0 else "Male",
                    "phone_number": f"+91-{9000000000 + (year * 1000 + i)}",
                    "address": f"{i + 100}, Main Street, Hyderabad",
                    "parent_name": f"{last} {first[:1]}. Parent",
                    "parent_phone": f"+91-{8000000000 + (year * 1000 + i)}",
                    "parent_email": f"parent.{first.lower()}@campus.edu",
                    "profile_photo_url": None,
                    "cgpa": cgpa,
                    "current_semester_gpa": round(cgpa + (hash(str(year + i)) % 10 - 5) / 10, 2),
                    "attendance_percentage": attendance,
                    "credits_earned": min(160, year * 35 + i * 2),
                    "total_credits": 180,
                    "faculty_advisor": "Dr. Nandini Reddy",
                    "placement_readiness_score": readiness,
                    "risk_score": risk_score,
                    "skill_score": min(95, max(30, int(cgpa * 8 + 15))),
                    "resume_score": min(95, max(25, int(readiness * 0.85 + 10))),
                    "coding_score": min(95, max(20, int(cgpa * 7 + attendance * 0.15))),
                    "mock_interview_score": min(90, max(20, int(readiness * 0.7 + 15))),
                    "communication_score": min(90, max(20, int(cgpa * 6 + 10))),
                    "applications": 0 if year < 3 else (i * 2 + 1),
                    "eligible_companies": 0 if year < 3 else (5 + i % 10),
                    "offers": 0 if year < 4 else (1 if i % 3 == 0 else 0),
                    "preferred_role": "SDE" if i % 2 == 0 else "ML Engineer",
                    "expected_package": f"{10 + i % 15} LPA",
                    "semester_gpas": [
                        {"semester": f"Sem {s}", "sgpa": round(cgpa + (hash(str(s)) % 10 - 5) / 10, 2), "cgpa": round(cgpa, 2), "credits": 24}
                        for s in range(1, year * 2)
                    ],
                    "subjects_data": [
                        {"code": f"SUB{year}{j:02d}", "name": subjects_by_year[year][j], "faculty": "Dr. Nandini Reddy", "credits": 4, "type": "Theory", "internal_marks": 15 + (hash(str(i + j)) % 15), "external_marks": 40 + (hash(str(i * j)) % 25), "total_marks": 60 + (hash(str(i + j * 3)) % 25)}
                        for j in range(len(subjects_by_year[year]))
                    ],
                    "skills_data": {
                        "programming_languages": ["Python", "Java", "C++"][:2 + i % 2],
                        "frameworks": ["React", "FastAPI", "TensorFlow"][:i % 3],
                        "ai_skills": ["Machine Learning", "Deep Learning", "NLP"][:i % 3],
                        "soft_skills": ["Communication", "Teamwork", "Leadership"][:2 + i % 2],
                    },
                    "certifications": [f"{cert} Certification" for cert in ["AWS", "Azure", "Google Cloud", "Python", "Data Science"][:i % 5]],
                    "eligible_companies_list": [],
                    "applied_companies_list": [],
                    "github_url": f"https://github.com/{first.lower()}{last.lower()}",
                    "linkedin_url": f"https://linkedin.com/in/{first.lower()}{last.lower()}",
                    "leetcode_url": f"https://leetcode.com/{first.lower()}{last.lower()}",
                    "portfolio_url": None,
                    "resume_url": None,
                    "backlogs": [] if cgpa > 7.0 else [f"Subject backlog in {subjects_by_year[year][hash(str(i)) % 5]}"] if cgpa > 6.0 else [f"Backlog in {subjects_by_year[year][j]}" for j in range(2)],
                    "monthly_attendance": [
                        {"month": ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m], "percentage": attendance - (hash(str(i + m)) % 20 - 10)}
                        for m in range(6)
                    ],
                    "assignment_completion": {
                        "total": 12 + year * 2,
                        "submitted": 8 + year * 2 - (hash(str(i)) % 4),
                        "pending": 2 + (hash(str(i)) % 4),
                    },
                    "strengths": ["Analytical Thinking", "Problem Solving", "Team Collaboration"][:2 + (i % 2)],
                    "weak_areas": ["Communication Skills", "Time Management", "Advanced Mathematics"][:1 + (i % 3)],
                    "recommended_action": "Focus on improving practical implementation skills through lab sessions." if risk != "Low" else "Continue current pace. Consider advanced elective courses.",
                    "intervention_notes": [] if risk == "Low" else ["Attendance drop detected - review required", "Schedule mentor meeting this week"],
                    "profile_picture": None,
                    "ai_score": 0,
                    "projects": [],
                    "hackathons": [],
                    "coding_profile": None,
                    "behavior_notes": [],
                    "parent_details": {},
                    "faculty_notes": [],
                    "timeline": [],
                    "ai_summary": {},
                })
    return students
