from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.database import Base


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    request_type = Column(String, nullable=False)
    requested_by = Column(Integer, nullable=False)
    requested_by_name = Column(String, nullable=True)

    related_record_type = Column(String, nullable=True) 
    related_record_id = Column(String, nullable=True)

    current_values = Column(Text, nullable=True)  
    requested_values = Column(Text, nullable=True) 
    reason = Column(String, nullable=True)

    status = Column(String, default="Draft")  
    priority = Column(String, default="Medium")

    approved_by = Column(Integer, nullable=True)
    approved_by_name = Column(String, nullable=True)
    decision_comment = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)