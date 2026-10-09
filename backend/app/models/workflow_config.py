from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.database.database import Base


class WorkflowConfig(Base):
    __tablename__ = "workflow_config"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    request_type = Column(String, nullable=False)
    approver_role = Column(String, default="Admin")
    approval_required = Column(Boolean, default=True)
    self_approval_allowed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)