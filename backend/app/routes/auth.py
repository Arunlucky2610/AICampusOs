import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import hash_password
from app.dependencies.auth import get_current_user
from app.models.password_reset_token import PasswordResetToken
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
from app.services.email_service import send_password_reset_email, send_test_email, send_welcome_email
from app.utils.response import ok

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    print(f"[REGISTER] email={payload.email} role={payload.role.value}", flush=True)
    user = create_user(db, payload)
    print(f"[REGISTER] Created user id={user.id} email={user.email} role={user.role.value}", flush=True)
    send_welcome_email(user.email, user.full_name, user.role.value)
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
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    logger.info("Forgot password request received for email: %s", payload.email)

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    logger.info("User found: %s", "yes" if user else "no")

    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = bcrypt.hashpw(raw_token.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        logger.info("Reset token generated")

        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            used=False,
        )
        db.add(reset)
        db.commit()
        logger.info("Reset token stored in database for user_id=%s", user.id)

        reset_url = f"{get_settings().frontend_url}/reset-password?token={raw_token}"
        logger.info("Reset link created: %s", reset_url)

        logger.info("Email send started for %s", payload.email)
        success = send_password_reset_email(payload.email, raw_token, user.full_name)
        logger.info("Email send %s for %s", "success" if success else "failure", payload.email)

        if not success:
            logger.warning("DEV RESET LINK: %s", reset_url)
    else:
        logger.info("No user found for email: %s - returning generic response", payload.email)

    return ok(message="Password reset instructions sent if the account exists")


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.used == False,  # noqa: E712
        PasswordResetToken.expires_at > datetime.now(timezone.utc),
    ).order_by(PasswordResetToken.created_at.desc()).all()

    matched_token = None
    for t in tokens:
        if bcrypt.checkpw(payload.token.encode("utf-8"), t.token_hash.encode("utf-8")):
            matched_token = t
            break

    if not matched_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    matched_token.used = True
    user = db.get(User, matched_token.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.hashed_password = hash_password(payload.password)
    db.commit()
    return ok(message="Password has been reset successfully")


@router.post("/test-email")
def test_email(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    logger.info("Test email request received for: %s", payload.email)
    success = send_test_email(payload.email)
    if success:
        logger.info("Test email sent successfully to %s", payload.email)
        return ok(message="Test email sent successfully")
    logger.error("Test email FAILED for %s - check SMTP configuration", payload.email)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SMTP configuration error - check backend logs")


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



