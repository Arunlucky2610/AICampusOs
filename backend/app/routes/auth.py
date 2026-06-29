from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    GoogleAuthResponse,
    GoogleCompleteRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.auth_service import (
    authenticate_user,
    create_google_temp_token,
    create_role_profile,
    create_user,
    decode_google_temp_token,
    get_google_redirect_response,
    issue_tokens,
    refresh_access_token,
    verify_google_access_token,
)
from app.services.email_service import send_password_reset_email
from app.utils.response import ok

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = create_user(db, payload)
    return issue_tokens(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    return issue_tokens(user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    return ok(message="Logged out")


@router.post("/refresh-token", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, payload.refresh_token)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    send_password_reset_email(payload.email, "demo-reset-token")
    return ok(message="Password reset instructions sent if the account exists")


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    return ok(message="Password reset token accepted in demo mode")


@router.post("/google", response_model=GoogleAuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    info = verify_google_access_token(payload.id_token)
    google_sub = info["sub"]
    email = info["email"].lower()
    full_name = info.get("name", email.split("@")[0])
    picture = info.get("picture", "")

    user = db.query(User).filter(
        (User.google_sub == google_sub) | (User.email == email)
    ).first()

    if user:
        if not user.google_sub:
            user.google_sub = google_sub
        if not user.profile_picture:
            user.profile_picture = picture
        db.commit()
        db.refresh(user)
        return get_google_redirect_response(user)

    temp_token = create_google_temp_token(email, full_name, picture, google_sub)
    return GoogleAuthResponse(
        status="role_required",
        google_temp_token=temp_token,
        email=email,
        full_name=full_name,
        profile_picture=picture,
    )


@router.post("/google/complete", response_model=TokenResponse)
def google_complete(payload: GoogleCompleteRequest, db: Session = Depends(get_db)):
    temp_data = decode_google_temp_token(payload.google_temp_token)
    email = temp_data["email"]
    full_name = temp_data["full_name"]
    google_sub = temp_data["google_sub"]
    picture = temp_data.get("picture", "")

    existing = db.query(User).filter(
        (User.google_sub == google_sub) | (User.email == email)
    ).first()
    if existing:
        return get_google_redirect_response(existing)

    import bcrypt
    random_hash = bcrypt.hashpw(b"unused", bcrypt.gensalt()).decode("utf-8")

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=random_hash,
        role=payload.role,
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

    return issue_tokens(user)



