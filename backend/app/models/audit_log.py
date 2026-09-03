from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, nullable=True)  
    action = Column(String, nullable=False)  
    resource_type = Column(String, nullable=True)  
    resource_id = Column(String, nullable=True)

    description = Column(String, nullable=True)
    status = Column(String, default="Success")  

    before_values = Column(Text, nullable=True) 
    after_values = Column(Text, nullable=True) 

    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

  
    company = Column(String, nullable=True)
    user = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=True)