from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database.database import get_db
from app.dependencies.role import require_admin

from app.services.reconciliation_service import (
    run_reconciliation,
    get_dashboard_summary,
    get_issues,
    get_issue_detail,
    update_issue_status,
    get_reconciliation_history,
)

router = APIRouter()


@router.get("/summary")
def summary(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return get_dashboard_summary(db=db, company_id=current_user["company_id"])


@router.post("/run")
def trigger_run(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return run_reconciliation(db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Admin"))


@router.get("/history")
def history(page: int = 1, limit: int = 20, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return get_reconciliation_history(db=db, company_id=current_user["company_id"], page=page, limit=limit)


@router.get("/issues")
def list_issues(
    page: int = 1, limit: int = 25, search: Optional[str] = None,
    issue_type: Optional[str] = None, severity: Optional[str] = None,
    module: Optional[str] = None, status: Optional[str] = None,
    start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
    current_user: dict = Depends(require_admin), db: Session = Depends(get_db),
):
    return get_issues(db=db, company_id=current_user["company_id"], page=page, limit=limit, search=search, issue_type=issue_type, severity=severity, module=module, status=status, start_date=start_date, end_date=end_date)


@router.get("/issues/{issue_id}")
def issue_detail(issue_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return get_issue_detail(db=db, company_id=current_user["company_id"], issue_id=issue_id)


@router.patch("/issues/{issue_id}/status")
def change_status(issue_id: int, data: dict, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return update_issue_status(db=db, company_id=current_user["company_id"], issue_id=issue_id, user_id=current_user["user_id"], user_name=current_user.get("sub", "Admin"), new_status=data["status"], resolution_note=data.get("resolution_note"))