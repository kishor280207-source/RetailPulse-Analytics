from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.database import Base


class WorkflowRequest(Base):
    __tablename__ = "workflow_requests"

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
    priority = Column(String, default="Medium")

    status = Column(String, default="Draft")  
    approver_role = Column(String, default="Admin")

    approved_by = Column(Integer, nullable=True)
    approved_by_name = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)

    staged_file_path = Column(String, nullable=True)  

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)