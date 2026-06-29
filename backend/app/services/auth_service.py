from datetime import timedelta

import requests
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, create_token, decode_token, hash_password, verify_password
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


def verify_google_access_token(access_token: str) -> dict:
    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")
    info = response.json()
    if "sub" not in info or "email" not in info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token response")
    return info


def create_google_temp_token(email: str, full_name: str, picture: str, google_sub: str) -> str:
    return create_token(
        subject=email,
        token_type="google_temp",
        expires_delta=timedelta(minutes=10),
        extra_payload={
            "email": email,
            "full_name": full_name,
            "picture": picture,
            "google_sub": google_sub,
        },
    )


def decode_google_temp_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired temp token") from exc
    if payload.get("type") != "google_temp":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid temp token type")
    return payload


def get_google_redirect_response(user: User) -> dict:
    tokens = issue_tokens(user)
    return {
        "status": "login",
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "user": tokens["user"],
        "role": user.role,
    }
