from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Request
from app.services.audit_service import create_audit_log
from app.database.database import get_db
from app.schemas.login import LoginRequest
from app.services.auth_service import authenticate_user
from app.utils.jwt import create_access_token, create_refresh_token

router = APIRouter()


@router.post("/login")
def login(
    request: Request,
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = authenticate_user(
    db,
    login_request.email,
    login_request.password
)
    

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    access_token = create_access_token(
    {
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
        "company_id": user.company_id
    }
)
    refresh_token = create_refresh_token(
        {
            "sub": user.email
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "user": {
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
