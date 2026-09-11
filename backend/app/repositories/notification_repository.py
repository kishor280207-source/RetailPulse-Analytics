from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.notification import Notification
from app.services.audit_service import create_audit_log

ADMIN_ONLY_TYPES = ["StockoutRisk", "LowStock", "Overstock", "ImportCompleted", "ImportFailed"]


def get_notifications(
    db: Session,
    company_id: int,
    user_id: int,
    role: str = "User",
    page: int = 1,
    limit: int = 20,
    read_status: str = None,
    type: str = None,
    priority: str = None,
):
    query = db.query(Notification).filter(
        Notification.company_id == company_id,
        or_(Notification.user_id == user_id, Notification.user_id.is_(None)),
    )
    if role != "Admin":
        query = query.filter(~Notification.type.in_(ADMIN_ONLY_TYPES))

    query = query.filter(
        or_(Notification.expires_at.is_(None), Notification.expires_at > datetime.utcnow())
    )

    if read_status == "read":
        query = query.filter(Notification.is_read == True)
    elif read_status == "unread":
        query = query.filter(Notification.is_read == False)

    if type:
        query = query.filter(Notification.type == type)

    if priority:
        query = query.filter(Notification.priority == priority)

    total = query.count()

    records = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": records,
    }


def get_unread_count(db: Session, company_id: int, user_id: int, role: str = "User"):
    query = db.query(Notification).filter(
        Notification.company_id == company_id,
        or_(Notification.user_id == user_id, Notification.user_id.is_(None)),
        Notification.is_read == False,
        or_(Notification.expires_at.is_(None), Notification.expires_at > datetime.utcnow()),
    )

    if role != "Admin":
        query = query.filter(~Notification.type.in_(ADMIN_ONLY_TYPES))

    count = query.count()

    return {"unread_count": count}


def mark_as_read(db: Session, company_id: int, user_id: int, user_name: str, notification_id: int):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.company_id == company_id,
            or_(Notification.user_id == user_id, Notification.user_id.is_(None)),
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()

        create_audit_log(
            db=db,
            company_id=company_id,
            user_id=user_id,
            user_name=user_name,
            action="UPDATE",
            resource_type="Notification",
            resource_id=notification.id,
            description=f"Marked notification '{notification.title}' as read",
        )

    return {"id": notification.id, "is_read": notification.is_read}


def mark_all_as_read(db: Session, company_id: int, user_id: int, user_name: str):
    updated = (
        db.query(Notification)
        .filter(
            Notification.company_id == company_id,
            or_(Notification.user_id == user_id, Notification.user_id.is_(None)),
            Notification.is_read == False,
        )
        .update({"is_read": True, "read_at": datetime.utcnow()}, synchronize_session=False)
    )
    db.commit()

    if updated > 0:
        create_audit_log(
            db=db,
            company_id=company_id,
            user_id=user_id,
            user_name=user_name,
            action="UPDATE",
            resource_type="Notification",
            description=f"Marked all notifications as read ({updated} notifications)",
        )

    return {"updated_count": updated}