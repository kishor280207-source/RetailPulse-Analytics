from datetime import datetime, timedelta
 
from app.repositories import monitoring_repository as repo
from app.services.notification_service import create_notification as _create_notification
 
ALERT_COOLDOWN_MINUTES = 30  
 
def create_notification(db, company_id, type, severity, title, message):
    _create_notification(db=db, company_id=company_id, type=type, title=title, message=message, priority=severity)
     
def _should_alert(error_row) -> bool:
    if error_row.status == "Resolved":
        return True  
    if not error_row.last_alerted_at:
        return True
    return datetime.utcnow() - error_row.last_alerted_at > timedelta(minutes=ALERT_COOLDOWN_MINUTES)
 
 
def check_and_alert_error_rate(db, company_id):
    threshold = repo.get_threshold(db, "api_error_rate_pct", company_id)
    if not threshold:
        return
    since = datetime.utcnow() - timedelta(minutes=threshold.window_minutes)
    summary = repo.get_api_performance_summary(db, since)
    if summary["error_rate_pct"] >= float(threshold.threshold_value) and summary["total_requests"] >= 5:
        err = repo.record_error(
            db, category="API", component="global",
            message=f"API error rate {summary['error_rate_pct']}% exceeds threshold "
                     f"{threshold.threshold_value}% over {threshold.window_minutes}m",
            severity="High", company_id=company_id,
        )
        if _should_alert(err):
            create_notification(
                db, company_id=company_id, type="SystemAlert", severity="High",
                title="API error rate threshold exceeded",
                message=err.message,
            )
            repo.mark_error_alerted(db, err.id)
 
 
def check_and_alert_job_failures(db, job_type, company_id):
    threshold = repo.get_threshold(db, "job_failure_count", company_id)
    if not threshold:
        return
    recent_failures = repo.count_recent_failures(db, job_type, threshold.window_minutes)
    if recent_failures >= float(threshold.threshold_value):
        err = repo.record_error(
            db, category="BackgroundJob", component=job_type,
            message=f"{job_type} failed {recent_failures} times in the last "
                     f"{threshold.window_minutes} minutes",
            severity="High", endpoint_or_job=job_type, company_id=company_id,
        )
        if _should_alert(err):
            create_notification(
                db, company_id=company_id, type="SystemAlert", severity="High",
                title=f"{job_type} failing repeatedly",
                message=err.message,
            )
            repo.mark_error_alerted(db, err.id)
 
 
def check_and_alert_db_down(db, is_healthy: bool):
    """Call this right after the DB health check in GET /api/health."""
    if is_healthy:
        return
    err = repo.record_error(
        db, category="Database", component="database",
        message="Database health check failed", severity="Critical",
    )
    if _should_alert(err):
        create_notification(
            db, company_id=None, type="SystemAlert", severity="Critical",
            title="Database connectivity failure",
            message="The database health check is failing. Investigate immediately.",
        )
        repo.mark_error_alerted(db, err.id)
        