from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/")
def profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    return {
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "company_id": user.company_id
    }