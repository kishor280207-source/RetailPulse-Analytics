from app.repositories import monitoring_repository as repo
from app.utils.monitoring_alerts import check_and_alert_job_failures
from app.database.database import SessionLocal   
from app.services.notification_service import create_notification as _create_notification
 
 
class JobTracker:
    def __init__(self, db, job_type: str, triggered_by, company_id,
                 related_resource_type=None, related_resource_id=None,
                 idempotency_key=None, max_retries=3):
        self.db = db
        self.job_type = job_type
        self.triggered_by = triggered_by
        self.company_id = company_id
        self.idempotency_key = idempotency_key
        self.job = None
        self._result_summary = None
        self._related_resource_type = related_resource_type
        self._related_resource_id = related_resource_id
        self._max_retries = max_retries

    def create_notification(db, company_id, type, severity, title, message):
        create_notification(db=db, company_id=company_id, type=type, title=title, message=message, priority=severity)
    
    def __enter__(self):
    
        self.job = repo.create_job(
            self.db, self.job_type, self.triggered_by, self.company_id,
            self._related_resource_type, self._related_resource_id,
            self.idempotency_key, self._max_retries,
        )
        repo.mark_job_running(self.db, self.job.id)
        return self
 
    def set_result(self, summary: dict):
        self._result_summary = summary
 
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            reason = str(exc_val)[:500]
            repo.mark_job_failed(self.db, self.job.id, reason)
            check_and_alert_job_failures(self.db, self.job_type, self.company_id)
            return False  # re-raise
        repo.mark_job_completed(self.db, self.job.id, self._result_summary)
        return False