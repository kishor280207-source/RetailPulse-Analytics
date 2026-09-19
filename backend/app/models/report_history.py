from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.database import Base


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    generated_by = Column(Integer, nullable=False)
    generated_by_name = Column(String, nullable=True)

    report_type = Column(String, nullable=False)  
    filters_applied = Column(Text, nullable=True)  
    format = Column(String, default="View") 

    status = Column(String, default="Completed")  
    error_message = Column(String, nullable=True)
    record_count = Column(Integer, default=0)

    generated_at = Column(DateTime, default=datetime.utcnow)