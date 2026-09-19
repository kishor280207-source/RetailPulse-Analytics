from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from datetime import datetime
from app.database.database import Base


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)

    report_type = Column(String, nullable=False)
    filters = Column(Text, nullable=True)  

    frequency = Column(String, nullable=False)  
    execution_time = Column(String, nullable=False) 
    recipients = Column(Text, nullable=False)  
    export_format = Column(String, default="CSV")  
    is_active = Column(Boolean, default=True)

    last_run_at = Column(DateTime, nullable=True)
    last_run_status = Column(String, nullable=True)  
    next_run_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)