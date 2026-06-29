from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    auth_provider: str = "password"
    profile_picture: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminRead(UserRead):
    updated_at: datetime
