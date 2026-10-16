from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, Numeric, ForeignKey,
    TIMESTAMP, Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base  


class HealthCheckResult(Base):
    __tablename__ = "health_check_results"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    response_time_ms = Column(Integer)
    message = Column(String(500))
    checked_at = Column(TIMESTAMP, server_default=func.now())


class ApiPerformanceMetric(Base):
    __tablename__ = "api_performance_metrics"

    id = Column(BigInteger, primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    error_detail = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now())


class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String(50), nullable=False)
    triggered_by = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    status = Column(String(20), nullable=False, default="Pending")
    started_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    failure_reason = Column(String(500))
    related_resource_type = Column(String(50))
    related_resource_id = Column(Integer)
    idempotency_key = Column(String(100))
    result_summary = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())

    triggered_by_user = relationship("User", foreign_keys=[triggered_by])


class SystemError(Base):
    __tablename__ = "system_errors"

    id = Column(Integer, primary_key=True, index=True)
    error_category = Column(String(50), nullable=False)
    component = Column(String(100), nullable=False)
    endpoint_or_job = Column(String(255))
    severity = Column(String(20), nullable=False, default="Medium")
    fingerprint = Column(String(64), nullable=False, unique=True)
    message = Column(String(500), nullable=False)
    occurrence_count = Column(Integer, nullable=False, default=1)
    first_seen_at = Column(TIMESTAMP, server_default=func.now())
    last_seen_at = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(20), nullable=False, default="Open")
    resolution_notes = Column(String(1000))
    company_id = Column(Integer, ForeignKey("companies.id"))
    last_alerted_at = Column(TIMESTAMP)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="Open")
    severity = Column(String(20), nullable=False, default="Medium")
    related_error_id = Column(Integer, ForeignKey("system_errors.id"))
    opened_by = Column(Integer, ForeignKey("users.id"))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolution_summary = Column(String(1000))
    opened_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP)

    timeline = relationship("IncidentTimeline", backref="incident", order_by="IncidentTimeline.created_at")


class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(String(30), nullable=False)  
    from_status = Column(String(20))
    to_status = Column(String(20))
    note = Column(String(1000))
    created_at = Column(TIMESTAMP, server_default=func.now())


class MonitoringThreshold(Base):
    __tablename__ = "monitoring_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))  
    metric = Column(String(50), nullable=False)
    threshold_value = Column(Numeric, nullable=False)
    window_minutes = Column(Integer, nullable=False, default=15)
    is_active = Column(Boolean, nullable=False, default=True)
    updated_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(TIMESTAMP, server_default=func.now())