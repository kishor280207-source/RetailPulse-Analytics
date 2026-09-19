import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport


def get_report_history(db: Session, company_id: int, page: int = 1, limit: int = 20):
    query = db.query(ReportHistory).filter(ReportHistory.company_id == company_id)
    total = query.count()
    records = query.order_by(ReportHistory.generated_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
        "records": [
            {
                "id": r.id,
                "report_type": r.report_type,
                "generated_by_name": r.generated_by_name,
                "generated_at": r.generated_at,
                "filters_applied": json.loads(r.filters_applied) if r.filters_applied else {},
                "format": r.format,
                "status": r.status,
                "record_count": r.record_count,
            }
            for r in records
        ],
    }


def _calculate_next_run(frequency: str, execution_time: str) -> datetime:
    now = datetime.utcnow()
    hour, minute = map(int, execution_time.split(":"))
    next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    if next_run <= now:
        if frequency == "Daily":
            next_run += timedelta(days=1)
        elif frequency == "Weekly":
            next_run += timedelta(days=7)
        elif frequency == "Monthly":
            next_run += timedelta(days=30)

    return next_run


def create_schedule(db: Session, company_id: int, user_id: int, data: dict):
    next_run = _calculate_next_run(data["frequency"], data["execution_time"])

    schedule = ScheduledReport(
        company_id=company_id,
        created_by=user_id,
        report_type=data["report_type"],
        filters=json.dumps(data.get("filters", {}), default=str),
        frequency=data["frequency"],
        execution_time=data["execution_time"],
        recipients=json.dumps(data["recipients"]),
        export_format=data.get("export_format", "CSV"),
        is_active=True,
        next_run_at=next_run,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return _serialize_schedule(schedule)


def get_schedules(db: Session, company_id: int):
    schedules = db.query(ScheduledReport).filter(ScheduledReport.company_id == company_id).order_by(ScheduledReport.created_at.desc()).all()
    return [_serialize_schedule(s) for s in schedules]


def update_schedule(db: Session, company_id: int, schedule_id: int, data: dict):
    schedule = db.query(ScheduledReport).filter(ScheduledReport.id == schedule_id, ScheduledReport.company_id == company_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    for field in ["report_type", "frequency", "execution_time", "export_format"]:
        if field in data:
            setattr(schedule, field, data[field])

    if "filters" in data:
        schedule.filters = json.dumps(data["filters"], default=str)
    if "recipients" in data:
        schedule.recipients = json.dumps(data["recipients"])
    if "is_active" in data:
        schedule.is_active = data["is_active"]

    if "frequency" in data or "execution_time" in data:
        schedule.next_run_at = _calculate_next_run(schedule.frequency, schedule.execution_time)

    db.commit()
    db.refresh(schedule)
    return _serialize_schedule(schedule)


def delete_schedule(db: Session, company_id: int, schedule_id: int):
    schedule = db.query(ScheduledReport).filter(ScheduledReport.id == schedule_id, ScheduledReport.company_id == company_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted."}


def run_schedule_now(db: Session, company_id: int, user_id: int, user_name: str, schedule_id: int):
    from app.services.report_service import generate_report

    schedule = db.query(ScheduledReport).filter(ScheduledReport.id == schedule_id, ScheduledReport.company_id == company_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    filters = json.loads(schedule.filters) if schedule.filters else {}

    try:
        generate_report(db, company_id, user_id, user_name, schedule.report_type, filters, schedule.export_format)
        schedule.last_run_status = "Success"
    except Exception:
        schedule.last_run_status = "Failed"

    schedule.last_run_at = datetime.utcnow()
    schedule.next_run_at = _calculate_next_run(schedule.frequency, schedule.execution_time)
    db.commit()

    return _serialize_schedule(schedule)


def _serialize_schedule(s: ScheduledReport):
    return {
        "id": s.id,
        "report_type": s.report_type,
        "filters": json.loads(s.filters) if s.filters else {},
        "frequency": s.frequency,
        "execution_time": s.execution_time,
        "recipients": json.loads(s.recipients) if s.recipients else [],
        "export_format": s.export_format,
        "is_active": s.is_active,
        "last_run_at": s.last_run_at,
        "last_run_status": s.last_run_status,
        "next_run_at": s.next_run_at,
    }