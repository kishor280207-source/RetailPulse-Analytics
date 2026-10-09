from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin

from app.services.workflow_service import (
    create_and_submit_request,
    stage_import_approval_request,
    approve_request,
    reject_request,
    cancel_request,
)
from app.repositories.workflow_repository import (
    get_queue,
    get_my_requests,
    get_request_detail,
    get_history,
    get_pending_count,
    list_configs,
    update_config,
)
from app.services.import_service import parse_csv, validate_rows

router = APIRouter()

STAGING_DIR = "import_staging"
os.makedirs(STAGING_DIR, exist_ok=True)


@router.get("/requests/my")
def my_requests(
    page: int = 1, limit: int = 25, search: Optional[str] = None,
    request_type: Optional[str] = None, status: Optional[str] = None,
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db),
):
    return get_my_requests(db, current_user["company_id"], current_user["user_id"], page, limit, search, request_type, status)


@router.get("/requests/queue")
def queue(
    page: int = 1, limit: int = 25, search: Optional[str] = None,
    request_type: Optional[str] = None, status: Optional[str] = None, sort_order: str = "desc",
    current_user: dict = Depends(require_admin), db: Session = Depends(get_db),
):
    return get_queue(db, current_user["company_id"], current_user.get("role", "Admin"), page, limit, search, request_type, status, sort_order)


@router.get("/pending-count")
def pending_count(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_pending_count(db, current_user["company_id"], current_user.get("role", "User"))


@router.get("/config")
def workflow_config(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return list_configs(db, current_user["company_id"])


@router.put("/config/{config_id}")
def edit_workflow_config(config_id: int, data: dict, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    result = update_config(db, current_user["company_id"], config_id, data)
    from app.services.audit_service import create_audit_log
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Admin"),
        action="UPDATE", resource_type="WorkflowConfig", resource_id=config_id,
        description=f"Workflow configuration updated for {result['request_type']}",
    )
    return result


@router.post("/requests")
def new_request(data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_and_submit_request(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        request_type=data["request_type"], related_record_id=data["related_record_id"],
        requested_values=data["requested_values"], reason=data["reason"], priority=data.get("priority", "Medium"),
    )


@router.post("/requests/import-approval")
async def new_import_approval_request(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    reason: str = Form(...),
    priority: str = Form("Medium"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    file_bytes = await file.read()
    try:
        df = parse_csv(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    validation = validate_rows(df, import_type, db, current_user["company_id"])

    staged_path = os.path.join(STAGING_DIR, f"{uuid.uuid4().hex}_{file.filename}")
    with open(staged_path, "wb") as f:
        f.write(file_bytes)

    return stage_import_approval_request(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        import_type=import_type, filename=file.filename,
        validation_summary={"total_records": validation["total_records"], "valid_records": validation["valid_records"], "invalid_records": validation["invalid_records"]},
        reason=reason, staged_file_path=staged_path, priority=priority,
    )


@router.get("/requests/{request_id}")
def request_detail(request_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_request_detail(db, current_user["company_id"], request_id, current_user)


@router.get("/requests/{request_id}/history")
def request_history(request_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_history(db, current_user["company_id"], request_id, current_user)


@router.post("/requests/{request_id}/approve")
def approve(request_id: int, data: dict = {}, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return approve_request(db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"), current_user, request_id, data.get("comment"))


@router.post("/requests/{request_id}/reject")
def reject(request_id: int, data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return reject_request(db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"), current_user, request_id, data["rejection_reason"])


@router.post("/requests/{request_id}/cancel")
def cancel(request_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    is_admin = current_user.get("role") == "Admin"
    return cancel_request(db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"), is_admin, request_id)