from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, nullable=True)  # denormalized for fast display, avoids a join on every log view

    action = Column(String, nullable=False)  # CREATE | UPDATE | DELETE | LOGIN | LOGOUT | IMPORT | EXPORT | etc.
    resource_type = Column(String, nullable=True)  # "Product", "Sale", "Customer", "User", etc.
    resource_id = Column(String, nullable=True)

    description = Column(String, nullable=True)
    status = Column(String, default="Success")  # Success | Failure

    before_values = Column(Text, nullable=True)  # JSON string
    after_values = Column(Text, nullable=True)  # JSON string

    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # legacy columns kept so old data/calls don't break - no longer written to going forward
    company = Column(String, nullable=True)
    user = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=True)