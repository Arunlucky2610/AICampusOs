from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserAdminRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserAdminRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles([UserRole.ADMIN])),
):
    return db.query(User).order_by(User.created_at.desc()).all()
