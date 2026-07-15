from fastapi import APIRouter, Depends

from app.utils.role import require_role

router = APIRouter()


@router.get("/dashboard")
def admin_dashboard(
    current_user=Depends(
        require_role(
            ["Super Admin", "Company Admin"]
        )
    )
):

    return {
        "message": "Welcome Admin",
        "user": current_user
    }