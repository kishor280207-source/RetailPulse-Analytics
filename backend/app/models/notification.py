from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    title = Column(String, nullable=False)

    message = Column(String, nullable=False)

    status = Column(String, default="Unread")

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )