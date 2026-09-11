from datetime import datetime
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    company_id: int,
    type: str,
    title: str,
    message: str,
    priority: str = "Medium",
    user_id: int = None,
    resource_type: str = None,
    resource_id=None,
    dedup_key: str = None,
    expires_at: datetime = None,
):
    """
    Creates a notification, but skips creating a duplicate if an UNREAD
    notification with the same dedup_key already exists for this company.
    This is the duplicate-prevention strategy required by the spec: rather
    than tracking "has this condition already been alerted in the last N
    hours", we simply never create a second unread alert for the same
    ongoing condition - once the existing one is read or the condition
    resolves and a fresh one is created later, a new alert can appear again.
    """
    if dedup_key:
        existing = (
            db.query(Notification)
            .filter(
                Notification.company_id == company_id,
                Notification.dedup_key == dedup_key,
                Notification.is_read == False,
            )
            .first()
        )
        if existing:
            return existing 

    notification = Notification(
        company_id=company_id,
        user_id=user_id,
        type=type,
        priority=priority,
        title=title,
        message=message,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        dedup_key=dedup_key,
        expires_at=expires_at,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification