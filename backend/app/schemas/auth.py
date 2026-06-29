from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    role: UserRole
    user: UserRead
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=72)


class GoogleAuthRequest(BaseModel):
    id_token: str


class GoogleAuthResponse(BaseModel):
    status: str
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str | None = None
    user: UserRead | None = None
    role: UserRole | None = None
    google_temp_token: str | None = None
    email: str | None = None
    full_name: str | None = None
    profile_picture: str | None = None


class GoogleCompleteRequest(BaseModel):
    google_temp_token: str
    role: UserRole
