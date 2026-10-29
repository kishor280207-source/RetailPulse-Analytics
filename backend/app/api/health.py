import time
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.repositories import monitoring_repository as repo

router = APIRouter()


@router.get("/health")
def public_health_check(db: Session = Depends(get_db)):
    
    components = {}
    overall = "Healthy"

    db_start = time.time()
    try:
        db.execute(text("SELECT 1"))
        db_ms = int((time.time() - db_start) * 1000)
        db_status = "Healthy" if db_ms < 500 else "Degraded"
        components["database"] = {"status": db_status, "response_time_ms": db_ms}
    except Exception:
        components["database"] = {"status": "Unavailable", "response_time_ms": None}
        overall = "Unavailable"

    try:
        recent = repo.get_latest_health_by_component(db)
        bg_row = next((r for r in recent if r.component == "background_jobs"), None)
        components["background_jobs"] = {
            "status": bg_row.status if bg_row else "Healthy",
            "response_time_ms": bg_row.response_time_ms if bg_row else None,
        }
    except Exception:
        components["background_jobs"] = {"status": "Degraded", "response_time_ms": None}

    components["api"] = {"status": "Healthy", "response_time_ms": 0}

    if overall != "Unavailable":
        degraded = any(c["status"] == "Degraded" for c in components.values())
        overall = "Degraded" if degraded else "Healthy"

    for name, c in components.items():
        repo.record_health_check(db, name, c["status"], c["response_time_ms"])

    return {
        "status": overall,
        "components": components,
        "checked_at": datetime.utcnow().isoformat(),
    }