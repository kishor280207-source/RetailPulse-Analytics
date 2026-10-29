from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class UserRoleHistory(Base):
    __tablename__ = "user_role_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    user_id = Column(Integer, nullable=False)
    user_name = Column(String, nullable=True)

    old_role = Column(String, nullable=True)
    new_role = Column(String, nullable=False)

    changed_by = Column(Integer, nullable=True)
    changed_by_name = Column(String, nullable=True)
    reason = Column(String, nullable=True)

    source = Column(String, default="Direct")  
    workflow_request_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
