import hashlib
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, and_, case
from sqlalchemy.orm import Session

from app.models.monitoring import (
    HealthCheckResult, ApiPerformanceMetric, BackgroundJob,
    SystemError, Incident, IncidentTimeline, MonitoringThreshold,
)
from app.models.user import User 

def record_health_check(db: Session, component: str, status: str,
                         response_time_ms: Optional[int] = None,
                         message: Optional[str] = None) -> HealthCheckResult:
    row = HealthCheckResult(
        component=component, status=status,
        response_time_ms=response_time_ms, message=message,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_latest_health_by_component(db: Session) -> list[HealthCheckResult]:
    """Latest row per component, via a lateral-style subquery."""
    sub = (
        db.query(
            HealthCheckResult.component,
            func.max(HealthCheckResult.checked_at).label("max_time"),
        )
        .group_by(HealthCheckResult.component)
        .subquery()
    )
    return (
        db.query(HealthCheckResult)
        .join(
            sub,
            and_(
                HealthCheckResult.component == sub.c.component,
                HealthCheckResult.checked_at == sub.c.max_time,
            ),
        )
        .all()
    )


def get_health_history(db: Session, component: str, hours: int = 24) -> list[HealthCheckResult]:
    since = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(HealthCheckResult)
        .filter(HealthCheckResult.component == component, HealthCheckResult.checked_at >= since)
        .order_by(HealthCheckResult.checked_at.asc())
        .all()
    )


def log_api_performance(db: Session, endpoint: str, method: str, status_code: int,
                         response_time_ms: int, company_id: Optional[int] = None,
                         user_id: Optional[int] = None,
                         error_detail: Optional[str] = None) -> None:
    row = ApiPerformanceMetric(
        endpoint=endpoint, method=method, status_code=status_code,
        response_time_ms=response_time_ms, company_id=company_id,
        user_id=user_id, error_detail=error_detail,
    )
    db.add(row)
    db.commit()


def get_api_performance_summary(db: Session, since: datetime) -> dict:
    row = (
        db.query(
            func.count(ApiPerformanceMetric.id).label("total"),
            func.avg(ApiPerformanceMetric.response_time_ms).label("avg_ms"),
            func.sum(
                case((ApiPerformanceMetric.status_code >= 500, 1), else_=0)
            ).label("failed"),
        )
        .filter(ApiPerformanceMetric.created_at >= since)
        .first()
    )
    total = row.total or 0
    failed = row.failed or 0
    return {
        "total_requests": total,
        "avg_response_time_ms": round(float(row.avg_ms), 1) if row.avg_ms else 0,
        "failed_requests": failed,
        "error_rate_pct": round((failed / total) * 100, 2) if total else 0,
    }


def list_api_performance(db: Session, company_id: Optional[int], endpoint: Optional[str],
                          status_code: Optional[int], success_only: Optional[bool],
                          start_date: Optional[datetime], end_date: Optional[datetime],
                          page: int, limit: int):
    q = db.query(ApiPerformanceMetric)
    if company_id is not None:
        q = q.filter(ApiPerformanceMetric.company_id == company_id)
    if endpoint:
        q = q.filter(ApiPerformanceMetric.endpoint.ilike(f"%{endpoint}%"))
    if status_code:
        q = q.filter(ApiPerformanceMetric.status_code == status_code)
    if success_only is True:
        q = q.filter(ApiPerformanceMetric.status_code < 400)
    elif success_only is False:
        q = q.filter(ApiPerformanceMetric.status_code >= 400)
    if start_date:
        q = q.filter(ApiPerformanceMetric.created_at >= start_date)
    if end_date:
        q = q.filter(ApiPerformanceMetric.created_at <= end_date)

    total = q.count()
    records = (
        q.order_by(ApiPerformanceMetric.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return records, total


def create_job(db: Session, job_type: str, triggered_by: Optional[int], company_id: Optional[int],
                related_resource_type: Optional[str] = None, related_resource_id: Optional[int] = None,
                idempotency_key: Optional[str] = None, max_retries: int = 3) -> BackgroundJob:
    job = BackgroundJob(
        job_type=job_type, triggered_by=triggered_by, company_id=company_id,
        status="Pending", related_resource_type=related_resource_type,
        related_resource_id=related_resource_id, idempotency_key=idempotency_key,
        max_retries=max_retries,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_job_running(db: Session, job_id: int) -> None:
    db.query(BackgroundJob).filter(BackgroundJob.id == job_id).update(
        {"status": "Running", "started_at": datetime.utcnow()}
    )
    db.commit()


def mark_job_completed(db: Session, job_id: int, result_summary: Optional[dict] = None) -> None:
    db.query(BackgroundJob).filter(BackgroundJob.id == job_id).update(
        {"status": "Completed", "completed_at": datetime.utcnow(), "result_summary": result_summary}
    )
    db.commit()


def mark_job_failed(db: Session, job_id: int, failure_reason: str) -> None:
    db.query(BackgroundJob).filter(BackgroundJob.id == job_id).update(
        {"status": "Failed", "completed_at": datetime.utcnow(), "failure_reason": failure_reason[:500]}
    )
    db.commit()


def increment_retry(db: Session, job_id: int) -> BackgroundJob:
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    job.retry_count += 1
    job.status = "Pending"
    job.failure_reason = None
    db.commit()
    db.refresh(job)
    return job


def cancel_job(db: Session, job_id: int) -> BackgroundJob:
    job = db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()
    job.status = "Cancelled"
    job.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session, company_id: Optional[int], job_type: Optional[str],
              status: Optional[str], page: int, limit: int):
    q = db.query(BackgroundJob)
    if company_id is not None:
        q = q.filter(BackgroundJob.company_id == company_id)
    if job_type:
        q = q.filter(BackgroundJob.job_type == job_type)
    if status:
        q = q.filter(BackgroundJob.status == status)
    total = q.count()
    records = (
        q.order_by(BackgroundJob.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return records, total


def get_job(db: Session, job_id: int) -> Optional[BackgroundJob]:
    return db.query(BackgroundJob).filter(BackgroundJob.id == job_id).first()


def count_recent_failures(db: Session, job_type: str, minutes: int) -> int:
    since = datetime.utcnow() - timedelta(minutes=minutes)
    return (
        db.query(func.count(BackgroundJob.id))
        .filter(BackgroundJob.job_type == job_type, BackgroundJob.status == "Failed",
                BackgroundJob.created_at >= since)
        .scalar()
    )

def make_fingerprint(category: str, component: str, message: str) -> str:
    raw = f"{category}:{component}:{message}".lower().strip()
    return hashlib.sha256(raw.encode()).hexdigest()


def record_error(db: Session, category: str, component: str, message: str,
                  severity: str = "Medium", endpoint_or_job: Optional[str] = None,
                  company_id: Optional[int] = None) -> SystemError:
    
    fp = make_fingerprint(category, component, message)
    existing = db.query(SystemError).filter(SystemError.fingerprint == fp).first()
    if existing:
        existing.occurrence_count += 1
        existing.last_seen_at = datetime.utcnow()
        if existing.status == "Resolved":
            existing.status = "Open"  
        db.commit()
        db.refresh(existing)
        return existing

    row = SystemError(
        error_category=category, component=component, message=message[:500],
        severity=severity, endpoint_or_job=endpoint_or_job, fingerprint=fp,
        company_id=company_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_errors(db: Session, company_id: Optional[int], severity: Optional[str],
                 component: Optional[str], status: Optional[str],
                 start_date: Optional[datetime], end_date: Optional[datetime],
                 page: int, limit: int):
    q = db.query(SystemError)
    if company_id is not None:
        q = q.filter(SystemError.company_id == company_id)
    if severity:
        q = q.filter(SystemError.severity == severity)
    if component:
        q = q.filter(SystemError.component.ilike(f"%{component}%"))
    if status:
        q = q.filter(SystemError.status == status)
    if start_date:
        q = q.filter(SystemError.last_seen_at >= start_date)
    if end_date:
        q = q.filter(SystemError.last_seen_at <= end_date)

    total = q.count()
    records = (
        q.order_by(SystemError.last_seen_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return records, total


def update_error_status(db: Session, error_id: int, status: str,
                         resolution_notes: Optional[str] = None) -> Optional[SystemError]:
    err = db.query(SystemError).filter(SystemError.id == error_id).first()
    if not err:
        return None
    err.status = status
    if resolution_notes is not None:
        err.resolution_notes = resolution_notes[:1000]
    db.commit()
    db.refresh(err)
    return err


def create_incident(db: Session, title: str, severity: str, opened_by: int,
                     related_error_id: Optional[int] = None) -> Incident:
    incident = Incident(
        title=title, severity=severity, opened_by=opened_by,
        related_error_id=related_error_id, status="Open",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    db.add(IncidentTimeline(
        incident_id=incident.id, user_id=opened_by, event_type="StatusChange",
        from_status=None, to_status="Open",
    ))
    db.commit()
    return incident


def update_incident_status(db: Session, incident_id: int, new_status: str, user_id: int,
                            note: Optional[str] = None,
                            resolution_summary: Optional[str] = None) -> Optional[Incident]:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        return None
    old_status = incident.status
    incident.status = new_status
    if new_status == "Resolved":
        incident.resolved_at = datetime.utcnow()
        incident.resolved_by = user_id
        if resolution_summary:
            incident.resolution_summary = resolution_summary[:1000]
    db.add(IncidentTimeline(
        incident_id=incident.id, user_id=user_id, event_type="StatusChange",
        from_status=old_status, to_status=new_status,
    ))
    if note:
        db.add(IncidentTimeline(
            incident_id=incident.id, user_id=user_id, event_type="Note", note=note[:1000],
        ))
    db.commit()
    db.refresh(incident)
    return incident


def add_incident_note(db: Session, incident_id: int, user_id: int, note: str) -> None:
    db.add(IncidentTimeline(
        incident_id=incident_id, user_id=user_id, event_type="Note", note=note[:1000],
    ))
    db.commit()


def list_incidents(db: Session, status: Optional[str], severity: Optional[str],
                    page: int, limit: int):
    q = db.query(Incident)
    if status:
        q = q.filter(Incident.status == status)
    if severity:
        q = q.filter(Incident.severity == severity)
    total = q.count()
    records = (
        q.order_by(Incident.opened_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return records, total


def get_incident(db: Session, incident_id: int) -> Optional[Incident]:
    return db.query(Incident).filter(Incident.id == incident_id).first()


def get_threshold(db: Session, metric: str, company_id: Optional[int] = None) -> Optional[MonitoringThreshold]:
    """Company-specific threshold wins over the global default."""
    if company_id:
        row = (
            db.query(MonitoringThreshold)
            .filter(MonitoringThreshold.metric == metric,
                    MonitoringThreshold.company_id == company_id,
                    MonitoringThreshold.is_active.is_(True))
            .first()
        )
        if row:
            return row
    return (
        db.query(MonitoringThreshold)
        .filter(MonitoringThreshold.metric == metric,
                MonitoringThreshold.company_id.is_(None),
                MonitoringThreshold.is_active.is_(True))
        .first()
    )


def list_thresholds(db: Session, company_id: Optional[int] = None) -> list[MonitoringThreshold]:
    q = db.query(MonitoringThreshold)
    if company_id is not None:
        q = q.filter((MonitoringThreshold.company_id == company_id) | (MonitoringThreshold.company_id.is_(None)))
    return q.order_by(MonitoringThreshold.metric).all()


def upsert_threshold(db: Session, metric: str, threshold_value: float, window_minutes: int,
                      updated_by: int, company_id: Optional[int] = None) -> MonitoringThreshold:
    row = db.query(MonitoringThreshold).filter(
        MonitoringThreshold.metric == metric,
        MonitoringThreshold.company_id == company_id if company_id else MonitoringThreshold.company_id.is_(None),
    ).first()
    if row:
        row.threshold_value = threshold_value
        row.window_minutes = window_minutes
        row.updated_by = updated_by
        row.updated_at = datetime.utcnow()
    else:
        row = MonitoringThreshold(
            company_id=company_id, metric=metric, threshold_value=threshold_value,
            window_minutes=window_minutes, updated_by=updated_by,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def mark_error_alerted(db: Session, error_id: int) -> None:
    db.query(SystemError).filter(SystemError.id == error_id).update(
        {"last_alerted_at": datetime.utcnow()}
    )
    db.commit()