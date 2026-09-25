from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    triggered_by = Column(Integer, nullable=True)
    triggered_by_name = Column(String, nullable=True)

    status = Column(String, default="Running")  

    records_checked = Column(Integer, default=0)
    issues_detected = Column(Integer, default=0)
    issues_resolved = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)