from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.database import Base


class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    issue_type = Column(String, nullable=False)
    severity = Column(String, default="Medium")  
    affected_module = Column(String, nullable=False) 
    affected_record_id = Column(String, nullable=True)

    description = Column(String, nullable=False)
    details = Column(Text, nullable=True)  

    status = Column(String, default="Open")  
    resolution_note = Column(String, nullable=True)
    resolved_by = Column(Integer, nullable=True)
    resolved_by_name = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    previous_status = Column(String, nullable=True)

    dedup_key = Column(String, nullable=True, index=True)

    detected_at = Column(DateTime, default=datetime.utcnow)
    detected_run_id = Column(Integer, nullable=True)