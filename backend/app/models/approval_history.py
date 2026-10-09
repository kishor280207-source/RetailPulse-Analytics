from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, nullable=False)

    event = Column(String, nullable=False)  
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String, nullable=True)
    note = Column(String, nullable=True)

    occurred_at = Column(DateTime, default=datetime.utcnow)