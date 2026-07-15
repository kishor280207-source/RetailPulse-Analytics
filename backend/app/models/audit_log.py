from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    company = Column(String)
    user = Column(String)
    action = Column(String)

    ip_address = Column(String)
    browser = Column(String)

    timestamp = Column(DateTime, default=datetime.utcnow)