from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class GovernanceChangeLog(Base):
    __tablename__ = "governance_change_log"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    change_type = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(String, nullable=True)
    target_label = Column(String, nullable=True)

    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)

    changed_by = Column(Integer, nullable=True)
    changed_by_name = Column(String, nullable=True)
    reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
