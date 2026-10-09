import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.workflow_request import WorkflowRequest
from app.models.workflow_history import WorkflowApprovalHistory
from app.models.workflow_config import WorkflowConfig
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement

from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log

REQUEST_TYPES = [
    "StockAdjustment",
    "ProductDeactivation",
    "ProductPriceChange",
    "CustomerInfoChange",
    "InventoryImportApproval",
]

ALLOWED_TRANSITIONS = {
    "Draft": {"Submitted", "Cancelled"},
    "Submitted": {"Pending Approval", "Cancelled"},
    "Pending Approval": {"Approved", "Rejected", "Cancelled"},
    "Approved": set(),
    "Rejected": set(),
    "Cancelled": set(),
}


def _validate_transition(current_status: str, new_status: str):
    if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(status_code=400, detail=f"Cannot change status from '{current_status}' to '{new_status}'.")


def _add_history(db: Session, request_id: int, action: str, performed_by, performed_by_name, comment):
    entry = WorkflowApprovalHistory(
        request_id=request_id,
        action=action,
        performed_by=performed_by,
        performed_by_name=performed_by_name,
        comment=comment,
    )
    db.add(entry)
    db.commit()


def _get_request_or_404(db: Session, company_id: int, request_id: int) -> WorkflowRequest:
    req = db.query(WorkflowRequest).filter(WorkflowRequest.id == request_id, WorkflowRequest.company_id == company_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    return req


def _check_visibility(req: WorkflowRequest, current_user: dict):
    """A requester sees their own requests; an Admin or the configured approver role sees any."""
    role = current_user.get("role", "User")
    if role == "Admin":
        return
    if req.requested_by == current_user.get("user_id"):
        return
    if role == req.approver_role:
        return
    raise HTTPException(status_code=403, detail="You do not have access to this request.")


def _check_approver_authorization(req: WorkflowRequest, current_user: dict, config: WorkflowConfig = None):
    role = current_user.get("role", "User")
    user_id = current_user.get("user_id")

    if role != "Admin" and role != req.approver_role:
        raise HTTPException(status_code=403, detail="You are not authorized to approve or reject this request type.")

    if req.requested_by == user_id:
        self_allowed = config.self_approval_allowed if config else False
        if not self_allowed:
            raise HTTPException(status_code=403, detail="You cannot approve or reject your own request.")


def get_or_seed_config(db: Session, company_id: int, request_type: str = None) -> WorkflowConfig:
    query = db.query(WorkflowConfig).filter(WorkflowConfig.company_id == company_id)
    existing_types = {c.request_type for c in query.all()}

    for rtype in REQUEST_TYPES:
        if rtype not in existing_types:
            db.add(WorkflowConfig(company_id=company_id, request_type=rtype, approver_role="Admin", approval_required=True, self_approval_allowed=False, is_active=True))
    db.commit()

    if request_type:
        return db.query(WorkflowConfig).filter(WorkflowConfig.company_id == company_id, WorkflowConfig.request_type == request_type).first()
    return None


def _snapshot_current_values(db: Session, company_id: int, request_type: str, related_record_id):
    """
    Reads CURRENT values live from the real Product/Customer tables rather
    than trusting whatever the frontend sends - this is what makes the
    workflow module genuinely integrated with existing data instead of an
    isolated copy of it.
    """
    if request_type == "StockAdjustment":
        product = db.query(Product).filter(Product.id == related_record_id, Product.company_id == company_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"stock_quantity": product.stock_quantity}, "Product", product.name

    if request_type == "ProductDeactivation":
        product = db.query(Product).filter(Product.id == related_record_id, Product.company_id == company_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"status": product.status}, "Product", product.name

    if request_type == "ProductPriceChange":
        product = db.query(Product).filter(Product.id == related_record_id, Product.company_id == company_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"unit_price": product.unit_price}, "Product", product.name

    if request_type == "CustomerInfoChange":
        customer = db.query(Customer).filter(Customer.id == related_record_id, Customer.company_id == company_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found.")
        return {"full_name": customer.full_name, "email": customer.email, "phone": customer.phone}, "Customer", customer.full_name

    raise HTTPException(status_code=400, detail=f"Unsupported request type for this creation path: {request_type}")


def create_and_submit_request(db: Session, company_id: int, user_id: int, user_name: str, request_type: str, related_record_id, requested_values: dict, reason: str, priority: str = "Medium"):
    if request_type not in REQUEST_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown request type: {request_type}")
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="A reason is required.")

    current_values, related_record_type, record_label = _snapshot_current_values(db, company_id, request_type, related_record_id)

    config = get_or_seed_config(db, company_id, request_type)
    if not config.is_active:
        raise HTTPException(status_code=400, detail=f"{request_type} requests are currently disabled for this company.")

    req = WorkflowRequest(
        company_id=company_id,
        request_type=request_type,
        requested_by=user_id,
        requested_by_name=user_name,
        related_record_type=related_record_type,
        related_record_id=str(related_record_id),
        current_values=json.dumps(current_values, default=str),
        requested_values=json.dumps(requested_values, default=str),
        reason=reason,
        priority=priority,
        status="Draft",
        approver_role=config.approver_role,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    _add_history(db, req.id, "Created", user_id, user_name, None)

    req.status = "Submitted"
    db.commit()
    _add_history(db, req.id, "Submitted", user_id, user_name, None)

    req.status = "Pending Approval"
    db.commit()
    _add_history(db, req.id, "Pending Approval", user_id, user_name, None)

    create_audit_log(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        action="CREATE", resource_type="WorkflowRequest", resource_id=req.id,
        description=f"{request_type} request #{req.id} for {record_label} submitted for approval",
    )

    create_notification(
        db=db, company_id=company_id, type="ApprovalRequest", priority=priority,
        title=f"Approval Needed: {request_type}",
        message=f"{user_name} requested a {request_type} for {record_label}. Reason: {reason}",
        resource_type="WorkflowRequest", resource_id=req.id,
        dedup_key=f"approval_request:{req.id}:submitted",
    )

    if not config.approval_required:
        return _finalize_approval(db, req, user_id, user_name, comment="Auto-approved: approval not required by current configuration.")

    return _serialize_request(req, include_detail=True)


def stage_import_approval_request(db: Session, company_id: int, user_id: int, user_name: str, import_type: str, filename: str, validation_summary: dict, reason: str, staged_file_path: str, priority: str = "Medium"):
    config = get_or_seed_config(db, company_id, "InventoryImportApproval")
    if not config.is_active:
        raise HTTPException(status_code=400, detail="Inventory Import Approval requests are currently disabled.")

    requested_values = {"import_type": import_type, "filename": filename, **validation_summary}

    req = WorkflowRequest(
        company_id=company_id,
        request_type="InventoryImportApproval",
        requested_by=user_id,
        requested_by_name=user_name,
        related_record_type="Import",
        related_record_id=None,
        current_values=json.dumps({"note": "No change applied until approved."}),
        requested_values=json.dumps(requested_values, default=str),
        reason=reason,
        priority=priority,
        status="Draft",
        approver_role=config.approver_role,
        staged_file_path=staged_file_path,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    _add_history(db, req.id, "Created", user_id, user_name, None)
    req.status = "Submitted"; db.commit()
    _add_history(db, req.id, "Submitted", user_id, user_name, None)
    req.status = "Pending Approval"; db.commit()
    _add_history(db, req.id, "Pending Approval", user_id, user_name, None)

    create_audit_log(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        action="CREATE", resource_type="WorkflowRequest", resource_id=req.id,
        description=f"Inventory import '{filename}' staged for approval ({validation_summary.get('total_records', 0)} records)",
    )

    create_notification(
        db=db, company_id=company_id, type="ApprovalRequest", priority=priority,
        title="Approval Needed: Inventory Import",
        message=f"{user_name} wants to import '{filename}' ({validation_summary.get('total_records', 0)} records). Reason: {reason}",
        resource_type="WorkflowRequest", resource_id=req.id,
        dedup_key=f"approval_request:{req.id}:submitted",
    )

    return _serialize_request(req, include_detail=True)


def _apply_stock_adjustment(db: Session, req: WorkflowRequest, requested: dict):
    product = db.query(Product).filter(Product.id == int(req.related_record_id), Product.company_id == req.company_id).first()
    if not product:
        raise ValueError("Product no longer exists.")

    new_stock = int(requested["stock_quantity"])
    old_stock = product.stock_quantity
    product.stock_quantity = new_stock

    inventory = db.query(Inventory).filter(Inventory.company_id == req.company_id, Inventory.product_id == product.id).first()
    if not inventory:
        inventory = Inventory(company_id=req.company_id, product_id=product.id, current_stock=old_stock, available_stock=old_stock)
        db.add(inventory)
        db.flush()

    previous = inventory.current_stock
    inventory.current_stock = new_stock
    inventory.available_stock = new_stock

    movement = InventoryMovement(
        inventory_id=inventory.id,
        movement_type="Approved Adjustment",
        quantity_changed=new_stock - old_stock,
        previous_quantity=previous,
        updated_quantity=new_stock,
        reason=f"Approved via workflow request #{req.id}",
        remarks=req.reason,
        performed_by=req.approved_by,
    )
    db.add(movement)

    from app.services.alert_service import evaluate_product_stock_alert
    evaluate_product_stock_alert(db, req.company_id, product)


def _apply_product_status(db: Session, req: WorkflowRequest, requested: dict):
    product = db.query(Product).filter(Product.id == int(req.related_record_id), Product.company_id == req.company_id).first()
    if not product:
        raise ValueError("Product no longer exists.")
    product.status = requested["status"]


def _apply_price_change(db: Session, req: WorkflowRequest, requested: dict):
    product = db.query(Product).filter(Product.id == int(req.related_record_id), Product.company_id == req.company_id).first()
    if not product:
        raise ValueError("Product no longer exists.")
    product.unit_price = float(requested["unit_price"])


def _apply_customer_change(db: Session, req: WorkflowRequest, requested: dict):
    customer = db.query(Customer).filter(Customer.id == int(req.related_record_id), Customer.company_id == req.company_id).first()
    if not customer:
        raise ValueError("Customer no longer exists.")
    for field in ("full_name", "email", "phone"):
        if field in requested:
            setattr(customer, field, requested[field])


def _apply_inventory_import(db: Session, req: WorkflowRequest, requested: dict):
    """
    HONEST ARCHITECTURE NOTE: the uploaded CSV is staged to local disk
    (same single-server limitation documented for Task 17's threading) and
    read back here on approval, then handed to the existing start_import()
    pipeline from Task 12/17 - so approval reuses the same validated,
    audited, notification-integrated import path rather than duplicating it.
    """
    if not req.staged_file_path or not os.path.exists(req.staged_file_path):
        raise ValueError("Staged import file is missing or was already processed.")

    import pandas as pd
    from app.services.import_service import start_import
    from app.database.database import engine
    from sqlalchemy.orm import sessionmaker

    df = pd.read_csv(req.staged_file_path)
    SessionFactory = sessionmaker(bind=engine)

    start_import(
        db=db,
        db_session_factory=SessionFactory,
        company_id=req.company_id,
        user_id=req.requested_by,
        user_name=req.requested_by_name,
        import_type=requested.get("import_type"),
        filename=requested.get("filename"),
        df=df,
    )

    os.remove(req.staged_file_path)


def _apply_change(db: Session, req: WorkflowRequest):
    requested = json.loads(req.requested_values) if req.requested_values else {}

    dispatch = {
        "StockAdjustment": _apply_stock_adjustment,
        "ProductDeactivation": _apply_product_status,
        "ProductPriceChange": _apply_price_change,
        "CustomerInfoChange": _apply_customer_change,
        "InventoryImportApproval": _apply_inventory_import,
    }

    handler = dispatch.get(req.request_type)
    if not handler:
        raise ValueError(f"No handler for request type {req.request_type}")

    handler(db, req, requested)


def _finalize_approval(db: Session, req: WorkflowRequest, approver_id: int, approver_name: str, comment: str = None):
    """
    TRANSACTION SAFETY: the status flips to Approved only AFTER the
    underlying business change has been applied without error. If
    _apply_change raises, we roll back and the request stays Pending
    Approval - this avoids the exact failure mode the spec calls out:
    "approval marked successful but the underlying change was not applied."
    """
    try:
        db.refresh(req)
        if req.status != "Pending Approval":
            raise HTTPException(status_code=400, detail="Request is no longer pending approval.")

        _apply_change(db, req)

        req.status = "Approved"
        req.approved_by = approver_id
        req.approved_by_name = approver_name
        req.decided_at = datetime.utcnow()
        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        req.status = "Pending Approval"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Approval could not be completed, so the request remains pending: {str(e)}")

    _add_history(db, req.id, "Approved", approver_id, approver_name, comment)
    _add_history(db, req.id, f"{req.related_record_type or 'Record'} updated", approver_id, approver_name, None)

    create_audit_log(
        db=db, company_id=req.company_id, user_id=approver_id, user_name=approver_name,
        action="APPROVE", resource_type="WorkflowRequest", resource_id=req.id,
        description=f"{req.request_type} request #{req.id} approved",
        before_values=json.loads(req.current_values) if req.current_values else None,
        after_values=json.loads(req.requested_values) if req.requested_values else None,
    )

    create_notification(
        db=db, company_id=req.company_id, type="ApprovalRequest", priority="Low",
        title="Request Approved",
        message=f"Your {req.request_type} request #{req.id} was approved by {approver_name}.",
        user_id=req.requested_by, resource_type="WorkflowRequest", resource_id=req.id,
        dedup_key=f"approval_request:{req.id}:approved",
    )

    return _serialize_request(req, include_detail=True)


def approve_request(db: Session, company_id: int, approver_id: int, approver_name: str, current_user: dict, request_id: int, comment: str = None):
    req = _get_request_or_404(db, company_id, request_id)
    config = get_or_seed_config(db, company_id, req.request_type)
    _check_approver_authorization(req, current_user, config)
    _validate_transition(req.status, "Approved")
    return _finalize_approval(db, req, approver_id, approver_name, comment)


def reject_request(db: Session, company_id: int, approver_id: int, approver_name: str, current_user: dict, request_id: int, rejection_reason: str):
    if not rejection_reason or not rejection_reason.strip():
        raise HTTPException(status_code=400, detail="A rejection reason is required.")

    req = _get_request_or_404(db, company_id, request_id)
    config = get_or_seed_config(db, company_id, req.request_type)
    _check_approver_authorization(req, current_user, config)
    _validate_transition(req.status, "Rejected")

    req.status = "Rejected"
    req.rejection_reason = rejection_reason
    req.approved_by = approver_id
    req.approved_by_name = approver_name
    req.decided_at = datetime.utcnow()
    db.commit()

    if req.staged_file_path and os.path.exists(req.staged_file_path):
        os.remove(req.staged_file_path)

    _add_history(db, req.id, "Rejected", approver_id, approver_name, rejection_reason)

    create_audit_log(
        db=db, company_id=company_id, user_id=approver_id, user_name=approver_name,
        action="REJECT", resource_type="WorkflowRequest", resource_id=req.id,
        description=f"{req.request_type} request #{req.id} rejected: {rejection_reason}",
    )

    create_notification(
        db=db, company_id=company_id, type="ApprovalRequest", priority="Medium",
        title="Request Rejected",
        message=f"Your {req.request_type} request #{req.id} was rejected by {approver_name}. Reason: {rejection_reason}",
        user_id=req.requested_by, resource_type="WorkflowRequest", resource_id=req.id,
        dedup_key=f"approval_request:{req.id}:rejected",
    )

    return _serialize_request(req, include_detail=True)


def cancel_request(db: Session, company_id: int, user_id: int, user_name: str, is_admin: bool, request_id: int):
    req = _get_request_or_404(db, company_id, request_id)

    if req.requested_by != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="You can only cancel your own requests.")

    _validate_transition(req.status, "Cancelled")

    req.status = "Cancelled"
    db.commit()

    if req.staged_file_path and os.path.exists(req.staged_file_path):
        os.remove(req.staged_file_path)

    _add_history(db, req.id, "Cancelled", user_id, user_name, None)

    create_audit_log(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        action="CANCEL", resource_type="WorkflowRequest", resource_id=req.id,
        description=f"{req.request_type} request #{req.id} cancelled",
    )

    create_notification(
        db=db, company_id=company_id, type="ApprovalRequest", priority="Low",
        title="Request Cancelled",
        message=f"The {req.request_type} request #{req.id} was cancelled.",
        user_id=req.requested_by, resource_type="WorkflowRequest", resource_id=req.id,
        dedup_key=f"approval_request:{req.id}:cancelled",
    )

    return _serialize_request(req)


def _serialize_request(req: WorkflowRequest, include_detail: bool = False):
    base = {
        "id": req.id,
        "request_type": req.request_type,
        "requested_by": req.requested_by,
        "requested_by_name": req.requested_by_name,
        "related_record_type": req.related_record_type,
        "related_record_id": req.related_record_id,
        "reason": req.reason,
        "priority": req.priority,
        "status": req.status,
        "approver_role": req.approver_role,
        "approved_by_name": req.approved_by_name,
        "decided_at": req.decided_at,
        "rejection_reason": req.rejection_reason,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }
    if include_detail:
        base["current_values"] = json.loads(req.current_values) if req.current_values else {}
        base["requested_values"] = json.loads(req.requested_values) if req.requested_values else {}
    return base