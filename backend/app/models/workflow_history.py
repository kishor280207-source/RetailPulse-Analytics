from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class WorkflowApprovalHistory(Base):
    __tablename__ = "workflow_approval_history"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, nullable=False)

    action = Column(String, nullable=False) 
    performed_by = Column(Integer, nullable=True)
    performed_by_name = Column(String, nullable=True)
    comment = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)