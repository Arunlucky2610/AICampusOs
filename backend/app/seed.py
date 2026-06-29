from datetime import date

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    FacultyProfile,
    Notification,
    ParentProfile,
    PlacementProfile,
    Prediction,
    Roadmap,
    Skill,
    Student,
    User,
    UserRole,
)


DEFAULT_PASSWORD = "Campus@123"

TEST_USERS = [
    {"full_name": "System Admin", "email": "admin@aicampusos.com", "role": UserRole.ADMIN},
    {"full_name": "Arun Lucky", "email": "student@aicampusos.com", "role": UserRole.STUDENT},
    {"full_name": "Dr. Nandini Reddy", "email": "faculty@aicampusos.com", "role": UserRole.FACULTY},
    {"full_name": "Ramesh Kumar", "email": "parent@aicampusos.com", "role": UserRole.PARENT},
    {"full_name": "Suresh Rao", "email": "placement@aicampusos.com", "role": UserRole.PLACEMENT_OFFICER},
]


def upsert_user(db: Session, full_name: str, email: str, role: UserRole) -> tuple[User, bool]:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user:
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.is_verified = True
        user.hashed_password = hash_password(DEFAULT_PASSWORD)
        return user, False

    user = User(
        full_name=full_name,
        email=email.lower(),
        hashed_password=hash_password(DEFAULT_PASSWORD),
        role=role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user, True


def ensure_student_profile(db: Session, user: User) -> Student:
    profile = db.query(Student).filter(Student.user_id == user.id).first()
    if profile:
        return profile

    profile = Student(
        user_id=user.id,
        roll_number="AICOS2026001",
        department="Computer Science",
        year=3,
        cgpa=8.4,
        attendance_percentage=91,
        placement_readiness_score=78,
        risk_score=18,
        skill_score=72,
    )
    db.add(profile)
    db.flush()
    return profile


def ensure_faculty_profile(db: Session, user: User) -> None:
    if not db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first():
        db.add(FacultyProfile(user_id=user.id, department="Computer Science", designation="Professor"))


def ensure_placement_profile(db: Session, user: User) -> None:
    if not db.query(PlacementProfile).filter(PlacementProfile.user_id == user.id).first():
        db.add(PlacementProfile(user_id=user.id, department="Career Services"))


def ensure_parent_profile(db: Session, user: User, student: Student) -> None:
    if not db.query(ParentProfile).filter(ParentProfile.user_id == user.id).first():
        db.add(ParentProfile(user_id=user.id, student_id=student.id, relation="Father"))


def ensure_demo_data(db: Session, student: Student, users_by_role: dict[UserRole, User]) -> None:
    if not db.query(Notification).filter(Notification.user_id == users_by_role[UserRole.STUDENT].id).first():
        db.add(Notification(user_id=users_by_role[UserRole.STUDENT].id, title="Resume review complete", message="Your resume score improved to 82.", type="success"))
    if not db.query(Notification).filter(Notification.user_id == users_by_role[UserRole.ADMIN].id).first():
        db.add(Notification(user_id=users_by_role[UserRole.ADMIN].id, title="AI services healthy", message="All prediction workers are responding.", type="success"))
    if not db.query(Prediction).filter(Prediction.student_id == student.id, Prediction.prediction_type == "PLACEMENT").first():
        db.add(Prediction(student_id=student.id, prediction_type="PLACEMENT", score=84, result="High readiness", explanation="Strong academics and skill profile."))
    if not db.query(Prediction).filter(Prediction.student_id == student.id, Prediction.prediction_type == "RISK").first():
        db.add(Prediction(student_id=student.id, prediction_type="RISK", score=18, result="Low risk", explanation="Attendance and roadmap completion are healthy."))
    for skill_name, level, target in [("Python", 76, 90), ("Data Structures", 68, 85), ("Communication", 70, 88)]:
        if not db.query(Skill).filter(Skill.student_id == student.id, Skill.skill_name == skill_name).first():
            db.add(Skill(student_id=student.id, skill_name=skill_name, level=level, target_level=target))
    for title, description, status, due_date in [
        ("Mock interview loop", "Complete two technical and one HR mock.", "in_progress", date(2026, 7, 20)),
        ("Resume polish", "Add quantified project outcomes.", "planned", date(2026, 7, 8)),
    ]:
        if not db.query(Roadmap).filter(Roadmap.student_id == student.id, Roadmap.title == title).first():
            db.add(Roadmap(student_id=student.id, title=title, description=description, status=status, due_date=due_date))


def main() -> None:
    db = SessionLocal()
    created_status: list[tuple[User, bool]] = []
    try:
        users_by_role: dict[UserRole, User] = {}
        for item in TEST_USERS:
            user, was_created = upsert_user(db, item["full_name"], item["email"], item["role"])
            users_by_role[item["role"]] = user
            created_status.append((user, was_created))

        student = ensure_student_profile(db, users_by_role[UserRole.STUDENT])
        ensure_faculty_profile(db, users_by_role[UserRole.FACULTY])
        ensure_parent_profile(db, users_by_role[UserRole.PARENT], student)
        ensure_placement_profile(db, users_by_role[UserRole.PLACEMENT_OFFICER])
        ensure_demo_data(db, student, users_by_role)

        db.commit()

        print("AI CampusOS test users")
        print("----------------------")
        for user, was_created in created_status:
            status = "created" if was_created else "existing"
            print(f"{status}: {user.email} | {user.role.value} | password: {DEFAULT_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
