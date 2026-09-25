import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.data_quality_issue import DataQualityIssue
from app.models.reconciliation_run import ReconciliationRun
from app.services.reconciliation_checks import ALL_CHECKS

def _record_issue_if_new(db: Session, company_id: int, run_id: int, issue_data: dict):
    """
    Shared by both the full reconciliation run and the lightweight
    per-event checks below - creates a new issue only if no unresolved
    issue with the same dedup_key already exists.
    """
    existing = (
        db.query(DataQualityIssue)
        .filter(
            DataQualityIssue.company_id == company_id,
            DataQualityIssue.dedup_key == issue_data["dedup_key"],
            DataQualityIssue.status.in_(["Open", "Investigating"]),
        )
        .first()
    )
    if existing:
        return False

    issue = DataQualityIssue(
        company_id=company_id,
        issue_type=issue_data["issue_type"],
        severity=issue_data["severity"],
        affected_module=issue_data["affected_module"],
        affected_record_id=str(issue_data["affected_record_id"]),
        description=issue_data["description"],
        details=json.dumps(issue_data.get("details", {}), default=str),
        dedup_key=issue_data["dedup_key"],
        status="Open",
        detected_run_id=run_id,
    )
    db.add(issue)
    return True

def run_reconciliation(db: Session, company_id: int, user_id: int, user_name: str):
    
    run = ReconciliationRun(
        company_id=company_id,
        triggered_by=user_id,
        triggered_by_name=user_name,
        status="Running",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    total_checked = 0
    total_new_issues = 0
    failed_checks = 0

    for check_fn in ALL_CHECKS:
        try:
            found_issues, checked_count = check_fn(db, company_id)
            total_checked += checked_count

            for issue_data in found_issues:
               if _record_issue_if_new(db, company_id, run.id, issue_data):
                   total_new_issues += 1

        except Exception:
            failed_checks += 1

    db.commit()

    run.records_checked = total_checked
    run.issues_detected = total_new_issues
    run.failed_checks = failed_checks
    run.status = "Failed" if failed_checks == len(ALL_CHECKS) else ("Completed with Issues" if total_new_issues > 0 else "Completed")
    run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)

    return _serialize_run(run)


def get_dashboard_summary(db: Session, company_id: int):
    total_open = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.status == "Open").count()
    total_investigating = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.status == "Investigating").count()
    total_resolved = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.status == "Resolved").count()
    total_all = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id).count()

    last_run = (
        db.query(ReconciliationRun)
        .filter(ReconciliationRun.company_id == company_id)
        .order_by(ReconciliationRun.started_at.desc())
        .first()
    )

    return {
        "total_records_checked": last_run.records_checked if last_run else 0,
        "valid_records": (last_run.records_checked - total_all) if last_run else 0,
        "warnings": db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.severity.in_(["Low", "Medium"]), DataQualityIssue.status.in_(["Open", "Investigating"])).count(),
        "errors": db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.severity.in_(["High", "Critical"]), DataQualityIssue.status.in_(["Open", "Investigating"])).count(),
        "unresolved_issues": total_open + total_investigating,
        "last_reconciliation": last_run.completed_at if last_run else None,
    }


def get_issues(db: Session, company_id: int, page: int = 1, limit: int = 25, search: str = None, issue_type: str = None, severity: str = None, module: str = None, status: str = None, start_date=None, end_date=None):
    query = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(DataQualityIssue.description.ilike(like), DataQualityIssue.issue_type.ilike(like), DataQualityIssue.affected_record_id.ilike(like)))
    if issue_type:
        query = query.filter(DataQualityIssue.issue_type == issue_type)
    if severity:
        query = query.filter(DataQualityIssue.severity == severity)
    if module:
        query = query.filter(DataQualityIssue.affected_module == module)
    if status:
        query = query.filter(DataQualityIssue.status == status)
    if start_date:
        query = query.filter(DataQualityIssue.detected_at >= start_date)
    if end_date:
        query = query.filter(DataQualityIssue.detected_at <= end_date)

    total = query.count()
    records = query.order_by(DataQualityIssue.detected_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [_serialize_issue(r, include_details=False) for r in records],
    }


def get_issue_detail(db: Session, company_id: int, issue_id: int):
    issue = db.query(DataQualityIssue).filter(DataQualityIssue.id == issue_id, DataQualityIssue.company_id == company_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    return _serialize_issue(issue, include_details=True)


def update_issue_status(db: Session, company_id: int, issue_id: int, user_id: int, user_name: str, new_status: str, resolution_note: str = None):
    issue = db.query(DataQualityIssue).filter(DataQualityIssue.id == issue_id, DataQualityIssue.company_id == company_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    issue.previous_status = issue.status
    issue.status = new_status

    if new_status == "Resolved":
        issue.resolved_by = user_id
        issue.resolved_by_name = user_name
        issue.resolved_at = datetime.utcnow()
        if resolution_note:
            issue.resolution_note = resolution_note

        if issue.detected_run_id:
            originating_run = db.query(ReconciliationRun).filter(ReconciliationRun.id == issue.detected_run_id).first()
            if originating_run:
                originating_run.issues_resolved = (originating_run.issues_resolved or 0) + 1

    db.commit()
    db.refresh(issue)

    from app.services.audit_service import create_audit_log
    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        user_name=user_name,
        action="UPDATE",
        resource_type="DataQualityIssue",
        resource_id=issue.id,
        description=f"Issue #{issue.id} status changed from {issue.previous_status} to {new_status}",
        before_values={"status": issue.previous_status},
        after_values={"status": new_status, "resolution_note": resolution_note},
    )

    return _serialize_issue(issue, include_details=True)


def get_reconciliation_history(db: Session, company_id: int, page: int = 1, limit: int = 20):
    query = db.query(ReconciliationRun).filter(ReconciliationRun.company_id == company_id)
    total = query.count()
    records = query.order_by(ReconciliationRun.started_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [_serialize_run(r) for r in records],
    }


def _serialize_issue(issue: DataQualityIssue, include_details: bool):
    result = {
        "id": issue.id,
        "issue_type": issue.issue_type,
        "severity": issue.severity,
        "affected_module": issue.affected_module,
        "affected_record_id": issue.affected_record_id,
        "description": issue.description,
        "status": issue.status,
        "detected_at": issue.detected_at,
        "resolved_by_name": issue.resolved_by_name,
        "resolved_at": issue.resolved_at,
        "resolution_note": issue.resolution_note,
    }
    if include_details:
        result["details"] = json.loads(issue.details) if issue.details else {}
        result["previous_status"] = issue.previous_status
    return result


def _serialize_run(run: ReconciliationRun):
    return {
        "id": run.id,
        "triggered_by_name": run.triggered_by_name,
        "status": run.status,
        "records_checked": run.records_checked,
        "issues_detected": run.issues_detected,
        "issues_resolved": run.issues_resolved,
        "failed_checks": run.failed_checks,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
    }