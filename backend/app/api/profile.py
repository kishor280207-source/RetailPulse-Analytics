from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/")
def get_profile(user=Depends(get_current_user)):

    return {
        "message": "Profile fetched successfully",
        "user": user
    }