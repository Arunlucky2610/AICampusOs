import logging

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_firebase_auth

logger = logging.getLogger(__name__)
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.faculty import FacultyProfile
from app.models.parent import ParentProfile
from app.models.placement import PlacementProfile
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest


def create_role_profile(db: Session, user: User) -> None:
    if user.role == UserRole.STUDENT:
        db.add(
            Student(
                user_id=user.id,
                roll_number=f"AICOS{user.id:04d}",
                department="Computer Science",
                year=1,
                cgpa=0,
                attendance_percentage=0,
                placement_readiness_score=0,
                risk_score=0,
                skill_score=0,
            )
        )
    elif user.role == UserRole.FACULTY:
        db.add(FacultyProfile(user_id=user.id, department="Computer Science", designation="Faculty"))
    elif user.role == UserRole.PLACEMENT_OFFICER:
        db.add(PlacementProfile(user_id=user.id, department="Career Services"))
    elif user.role == UserRole.PARENT:
        student = db.query(Student).order_by(Student.id.asc()).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent registration requires at least one student record to link.",
            )
        db.add(ParentProfile(user_id=user.id, student_id=student.id, relation="Guardian"))


def create_user(db: Session, payload: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    try:
        user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()
        create_role_profile(db, user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or profile already exists") from exc
    except Exception:
        db.rollback()
        raise


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(str(user.id), user.role.value),
        "refresh_token": create_refresh_token(str(user.id)),
        "role": user.role,
        "user": user,
        "token_type": "bearer",
    }


def refresh_access_token(db: Session, refresh_token: str) -> dict[str, str]:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive or missing")
    return issue_tokens(user)


def verify_firebase_token(id_token: str) -> dict:
    firebase_auth = get_firebase_auth()
    if firebase_auth is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google sign-in is not configured. Use email/password login or contact the administrator.",
        )
    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as exc:
        logger.error("Firebase token verification failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {exc}",
        ) from exc

    return {
        "sub": decoded.get("uid", decoded.get("sub")),
        "email": decoded.get("email", ""),
        "full_name": decoded.get("name", ""),
        "picture": decoded.get("picture", ""),
    }


def create_google_user(db: Session, email: str, full_name: str, picture: str, google_sub: str, role: UserRole) -> User:
    import bcrypt
    random_hash = bcrypt.hashpw(b"unused", bcrypt.gensalt()).decode("utf-8")

    user = User(
        full_name=full_name or email.split("@")[0],
        email=email.lower(),
        hashed_password=random_hash,
        role=role,
        is_active=True,
        is_verified=True,
        auth_provider="google",
        google_sub=google_sub,
        profile_picture=picture,
    )
    db.add(user)
    db.flush()
    create_role_profile(db, user)
    db.commit()
    db.refresh(user)
    return user
