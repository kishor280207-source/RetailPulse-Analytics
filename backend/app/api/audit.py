from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("/")
def get_logs(
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).all()