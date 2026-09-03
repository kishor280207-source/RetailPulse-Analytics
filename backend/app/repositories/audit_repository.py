import json
from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.audit_log import AuditLog


def get_audit_logs(
    db: Session,
    company_id: int,
    page: int = 1,
    limit: int = 25,
    search: str = None,
    user_id: int = None,
    action: str = None,
    resource_type: str = None,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    sort_order: str = "desc",
):
    query = db.query(AuditLog).filter(AuditLog.company_id == company_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.user_name.ilike(like),
                AuditLog.action.ilike(like),
                AuditLog.resource_type.ilike(like),
                AuditLog.resource_id.ilike(like),
                AuditLog.description.ilike(like),
            )
        )

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if action:
        query = query.filter(AuditLog.action == action)

    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    if status:
        query = query.filter(AuditLog.status == status)

    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)

    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total_count = query.count()

    if sort_order == "asc":
        query = query.order_by(AuditLog.created_at.asc())
    else:
        query = query.order_by(AuditLog.created_at.desc())

    records = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total_count + limit - 1) // limit),
        "records": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_name": r.user_name,
                "action": r.action,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "description": r.description,
                "status": r.status,
                "ip_address": r.ip_address,
                "created_at": r.created_at,
            }
            for r in records
        ],
    }


def get_audit_log_detail(db: Session, company_id: int, log_id: int):
    record = (
        db.query(AuditLog)
        .filter(AuditLog.id == log_id, AuditLog.company_id == company_id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Audit log not found.")

    return {
        "id": record.id,
        "user_id": record.user_id,
        "user_name": record.user_name,
        "action": record.action,
        "resource_type": record.resource_type,
        "resource_id": record.resource_id,
        "description": record.description,
        "status": record.status,
        "before_values": json.loads(record.before_values) if record.before_values else None,
        "after_values": json.loads(record.after_values) if record.after_values else None,
        "ip_address": record.ip_address,
        "user_agent": record.user_agent,
        "created_at": record.created_at,
    }


def clear_audit_logs(db: Session, company_id: int, user_id: int, user_name: str, before_date: datetime = None):
    """
    Deletes audit logs for this company, optionally only those older than
    before_date. Records the clearing action itself as a new audit entry
    AFTER deletion, per spec requirement #15.
    """
    query = db.query(AuditLog).filter(AuditLog.company_id == company_id)

    if before_date:
        query = query.filter(AuditLog.created_at < before_date)

    deleted_count = query.count()
    query.delete(synchronize_session=False)
    db.commit()

   
    from app.services.audit_service import create_audit_log
    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        user_name=user_name,
        action="CLEAR_LOGS",
        resource_type="AuditLog",
        description=f"Cleared {deleted_count} audit log records"
        + (f" older than {before_date.date()}" if before_date else " (all records)"),
    )

    return {"deleted_count": deleted_count}