import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.database import get_db             
from app.dependencies.auth import get_current_user    
from app.repositories import monitoring_repository as repo

from app.services.audit_service import create_audit_log
from app.services.notification_service import create_notification



router = APIRouter(tags=["monitoring"])   

def log_audit_action(db, user_id, company_id, user_name, action,
                      resource_type=None, resource_id=None, description=None):
    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        user_name=user_name,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
    )
def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Only admins/managers can retry/cancel jobs, resolve incidents, or
    change thresholds. Adjust the role check to match your actual role
    names (e.g. 'Admin', 'Manager')."""
    if current_user.get("role") not in ("Admin", "Manager"):
        raise HTTPException(status_code=403, detail="Not authorized for this action")
    return current_user



@router.get("/health/overview")
def system_health_overview(db: Session = Depends(get_db),
                            current_user: dict = Depends(get_current_user)):
    """Full dashboard payload: overall status, per-component health,
    API performance summary, job counts, recent errors."""
    components = repo.get_latest_health_by_component(db)
    since = datetime.utcnow() - timedelta(minutes=15)
    perf = repo.get_api_performance_summary(db, since)

    company_id = current_user.get("company_id")
    jobs_completed, _ = repo.list_jobs(db, company_id, None, "Completed", 1, 1)
    jobs_failed, failed_total = repo.list_jobs(db, company_id, None, "Failed", 1, 1)
    jobs_active, active_total = repo.list_jobs(db, company_id, None, "Running", 1, 1)
    jobs_pending, pending_total = repo.list_jobs(db, company_id, None, "Pending", 1, 1)

    recent_errors, _ = repo.list_errors(db, company_id, None, None, "Open", None, None, 1, 5)

    overall = "Healthy"
    statuses = [c.status for c in components]
    if "Unavailable" in statuses:
        overall = "Unavailable"
    elif "Degraded" in statuses:
        overall = "Degraded"

    last_checked = max((c.checked_at for c in components), default=None)

    return {
        "overall_status": overall,
        "components": [
            {
                "component": c.component, "status": c.status,
                "response_time_ms": c.response_time_ms, "message": c.message,
                "checked_at": c.checked_at,
            } for c in components
        ],
        "api_availability_pct": round(100 - perf["error_rate_pct"], 2),
        "avg_api_response_time_ms": perf["avg_response_time_ms"],
        "failed_api_requests_15min": perf["failed_requests"],
        "jobs": {
            "active": active_total, "pending": pending_total,
            "failed_recent": failed_total,
        },
        "recent_errors": [
            {"id": e.id, "category": e.error_category, "component": e.component,
             "severity": e.severity, "message": e.message, "occurrence_count": e.occurrence_count,
             "last_seen_at": e.last_seen_at}
            for e in recent_errors
        ],
        "last_health_check_at": last_checked,
    }


@router.get("/health/{component}/history")
def component_health_history(component: str, hours: int = Query(24, ge=1, le=168),
                              db: Session = Depends(get_db),
                              current_user: dict = Depends(get_current_user)):
    history = repo.get_health_history(db, component, hours)
    return [
        {"status": h.status, "response_time_ms": h.response_time_ms, "checked_at": h.checked_at}
        for h in history
    ]


@router.get("/api-performance")
def get_api_performance(
    endpoint: Optional[str] = None,
    status_code: Optional[int] = None,
    success: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    company_id = current_user.get("company_id")
    records, total = repo.list_api_performance(
        db, company_id, endpoint, status_code, success, start_date, end_date, page, limit
    )
    return {
        "total": total, "page": page, "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "records": [
            {
                "id": r.id, "endpoint": r.endpoint, "method": r.method,
                "status_code": r.status_code, "response_time_ms": r.response_time_ms,
                "error_detail": r.error_detail, "created_at": r.created_at,
            } for r in records
        ],
    }

class RetryResponse(BaseModel):
    id: int
    status: str
    retry_count: int


@router.get("/jobs")
def get_jobs(
    job_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    company_id = current_user.get("company_id")
    records, total = repo.list_jobs(db, company_id, job_type, status, page, limit)
    return {
        "total": total, "page": page, "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "records": [
            {
                "id": j.id, "job_type": j.job_type, "triggered_by": j.triggered_by,
                "status": j.status, "started_at": j.started_at, "completed_at": j.completed_at,
                "duration_seconds": (
                    (j.completed_at - j.started_at).total_seconds()
                    if j.started_at and j.completed_at else None
                ),
                "retry_count": j.retry_count, "failure_reason": j.failure_reason,
                "created_at": j.created_at,
            } for j in records
        ],
    }


@router.get("/jobs/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    job = repo.get_job(db, job_id)
    if not job or (current_user.get("company_id") and job.company_id != current_user["company_id"]):
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id, "job_type": job.job_type, "triggered_by": job.triggered_by,
        "status": job.status, "started_at": job.started_at, "completed_at": job.completed_at,
        "retry_count": job.retry_count, "max_retries": job.max_retries,
        "failure_reason": job.failure_reason, "related_resource_type": job.related_resource_type,
        "related_resource_id": job.related_resource_id, "result_summary": job.result_summary,
        "created_at": job.created_at,
    }


@router.post("/jobs/{job_id}/retry", response_model=RetryResponse)
def retry_job(job_id: int, db: Session = Depends(get_db),
              current_user: dict = Depends(require_admin)):
    job = repo.get_job(db, job_id)
    if not job or (current_user.get("company_id") and job.company_id != current_user["company_id"]):
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "Failed":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
    if job.retry_count >= job.max_retries:
        raise HTTPException(status_code=400, detail="Max retries exceeded for this job")


    updated = repo.increment_retry(db, job_id)

    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="RetryBackgroundJob", resource_type="background_job", resource_id=job_id,
        description=f"Retried {job.job_type} job #{job_id} (attempt {updated.retry_count})",
        
    )


    return {"id": updated.id, "status": updated.status, "retry_count": updated.retry_count}


@router.post("/jobs/{job_id}/cancel")
def cancel_job_endpoint(job_id: int, db: Session = Depends(get_db),
                         current_user: dict = Depends(require_admin)):
    job = repo.get_job(db, job_id)
    if not job or (current_user.get("company_id") and job.company_id != current_user["company_id"]):
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("Pending", "Running"):
        raise HTTPException(status_code=400, detail="Only pending or running jobs can be cancelled")

    updated = repo.cancel_job(db, job_id)

    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="CancelBackgroundJob", resource_type="background_job", resource_id=job_id,
        description=f"Cancelled {job.job_type} job #{job_id}",

    )

    return {"id": updated.id, "status": updated.status}


class ErrorStatusUpdate(BaseModel):
    status: str  
    resolution_notes: Optional[str] = None


@router.get("/errors")
def get_errors(
    severity: Optional[str] = None,
    component: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    company_id = current_user.get("company_id")
    records, total = repo.list_errors(
        db, company_id, severity, component, status, start_date, end_date, page, limit
    )
    return {
        "total": total, "page": page, "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "records": [
            {
                "id": e.id, "error_category": e.error_category, "component": e.component,
                "endpoint_or_job": e.endpoint_or_job, "severity": e.severity,
                "occurrence_count": e.occurrence_count, "first_seen_at": e.first_seen_at,
                "last_seen_at": e.last_seen_at, "status": e.status, "message": e.message,
            } for e in records
        ],
    }


@router.put("/errors/{error_id}/status")
def set_error_status(error_id: int, payload: ErrorStatusUpdate,
                      db: Session = Depends(get_db),
                      current_user: dict = Depends(require_admin)):
    if payload.status not in ("Open", "Investigating", "Resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")
    err = repo.update_error_status(db, error_id, payload.status, payload.resolution_notes)
    if not err:
        raise HTTPException(status_code=404, detail="Error record not found")

    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="UpdateSystemErrorStatus", resource_type="system_error", resource_id=error_id,
        description=f"Set error #{error_id} status to {payload.status}",
    )
    return {"id": err.id, "status": err.status}


class IncidentCreate(BaseModel):
    title: str
    severity: str = "Medium"
    related_error_id: Optional[int] = None


class IncidentStatusUpdate(BaseModel):
    status: str  
    note: Optional[str] = None
    resolution_summary: Optional[str] = None


class IncidentNote(BaseModel):
    note: str


@router.get("/incidents")
def get_incidents(status: Optional[str] = None, severity: Optional[str] = None,
                   page: int = Query(1, ge=1), limit: int = Query(25, ge=1, le=200),
                   db: Session = Depends(get_db),
                   current_user: dict = Depends(get_current_user)):
    records, total = repo.list_incidents(db, status, severity, page, limit)
    return {
        "total": total, "page": page, "limit": limit,
        "records": [
            {
                "id": i.id, "title": i.title, "status": i.status, "severity": i.severity,
                "opened_at": i.opened_at, "resolved_at": i.resolved_at,
            } for i in records
        ],
    }


@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db),
                         current_user: dict = Depends(get_current_user)):
    incident = repo.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "id": incident.id, "title": incident.title, "status": incident.status,
        "severity": incident.severity, "opened_at": incident.opened_at,
        "resolved_at": incident.resolved_at, "resolution_summary": incident.resolution_summary,
        "timeline": [
            {
                "id": t.id, "user_id": t.user_id, "event_type": t.event_type,
                "from_status": t.from_status, "to_status": t.to_status,
                "note": t.note, "created_at": t.created_at,
            } for t in incident.timeline
        ],
    }


@router.post("/incidents")
def open_incident(payload: IncidentCreate, db: Session = Depends(get_db),
                   current_user: dict = Depends(require_admin)):
    incident = repo.create_incident(
        db, payload.title, payload.severity, current_user["user_id"], payload.related_error_id
    )
    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="OpenIncident", resource_type="incident", resource_id=incident.id,
        description=f"Opened incident: {payload.title}",
    )
    return {"id": incident.id, "status": incident.status}


@router.put("/incidents/{incident_id}/status")
def set_incident_status(incident_id: int, payload: IncidentStatusUpdate,
                         db: Session = Depends(get_db),
                         current_user: dict = Depends(require_admin)):
    if payload.status not in ("Investigating", "Resolved"):
        raise HTTPException(status_code=400, detail="Invalid status")
    incident = repo.update_incident_status(
        db, incident_id, payload.status, current_user["user_id"],
        payload.note, payload.resolution_summary,
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="UpdateIncidentStatus", resource_type="incident", resource_id=incident_id,
        description=f"Set incident #{incident_id} status to {payload.status}",
    )
    return {"id": incident.id, "status": incident.status}


@router.post("/incidents/{incident_id}/notes")
def add_incident_note(incident_id: int, payload: IncidentNote,
                       db: Session = Depends(get_db),
                       current_user: dict = Depends(require_admin)):
    incident = repo.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    repo.add_incident_note(db, incident_id, current_user["user_id"], payload.note)
    return {"status": "ok"}


class ThresholdUpdate(BaseModel):
    metric: str
    threshold_value: float
    window_minutes: int = 15


@router.get("/thresholds")
def get_thresholds(db: Session = Depends(get_db),
                    current_user: dict = Depends(require_admin)):
    rows = repo.list_thresholds(db, current_user.get("company_id"))
    return [
        {"id": r.id, "metric": r.metric, "threshold_value": float(r.threshold_value),
         "window_minutes": r.window_minutes, "company_id": r.company_id}
        for r in rows
    ]


@router.put("/thresholds")
def set_threshold(payload: ThresholdUpdate, db: Session = Depends(get_db),
                   current_user: dict = Depends(require_admin)):
    row = repo.upsert_threshold(
        db, payload.metric, payload.threshold_value, payload.window_minutes,
        current_user["user_id"], current_user.get("company_id"),
    )
    log_audit_action(
        db, user_id=current_user["user_id"], company_id=current_user.get("company_id"),
        user_name=current_user.get("user_name", current_user.get("email", "Unknown")),
        action="UpdateMonitoringThreshold", resource_type="monitoring_threshold", resource_id=row.id,
        description=f"Set threshold {payload.metric} = {payload.threshold_value} "
                     f"(window {payload.window_minutes}m)",
    )
    return {"id": row.id, "metric": row.metric, "threshold_value": float(row.threshold_value)}
