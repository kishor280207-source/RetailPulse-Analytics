from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    company_id: int,
    title: str,
    message: str
):

    notification = Notification(
        company_id=company_id,
        title=title,
        message=message
    )

    db.add(notification)
    db.commit()