from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.dependencies.auth import get_current_user

from app.repositories.notification_repository import (
    get_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
)
ADMIN_ONLY_TYPES = ["StockoutRisk", "LowStock", "Overstock", "ImportCompleted", "ImportFailed"]


def _visible_types_for_role(role: str):
    if role == "Admin":
        return None 
    return None  
router = APIRouter()


@router.get("/")
def list_notifications(
    
    page: int = 1,
    limit: int = 20,
    read_status: Optional[str] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = get_notifications(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        role=current_user.get("role", "User"),
        page=page,
        limit=limit,
        read_status=read_status,
        type=type,
        priority=priority,
    )

    result["records"] = [
        {
            "id": r.id,
            "type": r.type,
            "priority": r.priority,
            "title": r.title,
            "message": r.message,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "is_read": r.is_read,
            "created_at": r.created_at,
        }
        for r in result["records"]
    ]

    return result


@router.get("/unread-count")
def unread_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_unread_count(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        role=current_user.get("role", "User"),
    )


@router.patch("/read-all")
def read_all(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_all_as_read(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        user_name=current_user.get("sub", "Unknown"),
    )


@router.patch("/{notification_id}/read")
def read_one(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_as_read(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        user_name=current_user.get("sub", "Unknown"),
        notification_id=notification_id,
    )