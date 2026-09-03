from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database.database import get_db
from app.dependencies.role import require_admin

from app.repositories.audit_repository import (
    get_audit_logs,
    get_audit_log_detail,
    clear_audit_logs,
)

router = APIRouter()


@router.get("/")
def list_audit_logs(
    page: int = 1,
    limit: int = 25,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_order: str = "desc",
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return get_audit_logs(
        db=db,
        company_id=current_user["company_id"],
        page=page,
        limit=limit,
        search=search,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort_order=sort_order,
    )


@router.delete("/clear")
def clear_logs(
    before_date: Optional[datetime] = None,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return clear_audit_logs(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user.get("user_id"),
        user_name=current_user.get("sub", "Admin"),
        before_date=before_date,
    )


@router.get("/{log_id}")
def audit_log_detail(
    log_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return get_audit_log_detail(db=db, company_id=current_user["company_id"], log_id=log_id)