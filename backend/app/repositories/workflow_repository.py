from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.workflow_request import WorkflowRequest
from app.models.workflow_history import WorkflowApprovalHistory
from app.models.workflow_config import WorkflowConfig
from app.services.workflow_service import _get_request_or_404, _check_visibility, _serialize_request, get_or_seed_config


def get_queue(db: Session, company_id: int, role: str, page: int = 1, limit: int = 25, search: str = None, request_type: str = None, status: str = None, sort_order: str = "desc"):
    query = db.query(WorkflowRequest).filter(WorkflowRequest.company_id == company_id, WorkflowRequest.status == "Pending Approval")

    if role != "Admin":
        query = query.filter(WorkflowRequest.approver_role == role)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(WorkflowRequest.requested_by_name.ilike(like), WorkflowRequest.reason.ilike(like), WorkflowRequest.related_record_id.ilike(like)))

    if request_type:
        query = query.filter(WorkflowRequest.request_type == request_type)

    if status:
        query = query.filter(WorkflowRequest.status == status)

    total = query.count()

    if sort_order == "asc":
        query = query.order_by(WorkflowRequest.created_at.asc())
    else:
        query = query.order_by(WorkflowRequest.created_at.desc())

    records = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [_serialize_request(r) for r in records],
    }


def get_my_requests(db: Session, company_id: int, user_id: int, page: int = 1, limit: int = 25, search: str = None, request_type: str = None, status: str = None):
    query = db.query(WorkflowRequest).filter(WorkflowRequest.company_id == company_id, WorkflowRequest.requested_by == user_id)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(WorkflowRequest.reason.ilike(like), WorkflowRequest.related_record_id.ilike(like)))

    if request_type:
        query = query.filter(WorkflowRequest.request_type == request_type)

    if status:
        query = query.filter(WorkflowRequest.status == status)

    total = query.count()
    records = query.order_by(WorkflowRequest.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [_serialize_request(r) for r in records],
    }


def get_request_detail(db: Session, company_id: int, request_id: int, current_user: dict):
    req = _get_request_or_404(db, company_id, request_id)
    _check_visibility(req, current_user)
    return _serialize_request(req, include_detail=True)


def get_history(db: Session, company_id: int, request_id: int, current_user: dict):
    req = _get_request_or_404(db, company_id, request_id)
    _check_visibility(req, current_user)

    rows = db.query(WorkflowApprovalHistory).filter(WorkflowApprovalHistory.request_id == request_id).order_by(WorkflowApprovalHistory.created_at.asc()).all()

    return [
        {"action": r.action, "performed_by_name": r.performed_by_name, "comment": r.comment, "timestamp": r.created_at}
        for r in rows
    ]


def get_pending_count(db: Session, company_id: int, role: str):
    query = db.query(WorkflowRequest).filter(WorkflowRequest.company_id == company_id, WorkflowRequest.status == "Pending Approval")
    if role != "Admin":
        query = query.filter(WorkflowRequest.approver_role == role)
    return {"pending_count": query.count()}


def list_configs(db: Session, company_id: int):
    get_or_seed_config(db, company_id)  
    configs = db.query(WorkflowConfig).filter(WorkflowConfig.company_id == company_id).all()
    return [_serialize_config(c) for c in configs]


def update_config(db: Session, company_id: int, config_id: int, data: dict):
    config = db.query(WorkflowConfig).filter(WorkflowConfig.id == config_id, WorkflowConfig.company_id == company_id).first()
    if not config:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Workflow configuration not found.")

    for field in ("approver_role", "approval_required", "self_approval_allowed", "is_active"):
        if field in data:
            setattr(config, field, data[field])

    db.commit()
    db.refresh(config)
    return _serialize_config(config)


def _serialize_config(c: WorkflowConfig):
    return {
        "id": c.id,
        "request_type": c.request_type,
        "approver_role": c.approver_role,
        "approval_required": c.approval_required,
        "self_approval_allowed": c.self_approval_allowed,
        "is_active": c.is_active,
    }