
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.integration import IntegrationFailedRecord

router = APIRouter()


@router.post("/{failed_record_id}/retry")
def retry_failed_record(
    failed_record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id = (
        current_user["company_id"]
        if isinstance(current_user, dict)
        else current_user.company_id
    )

    record = (
        db.query(IntegrationFailedRecord)
        .filter(
            IntegrationFailedRecord.id == failed_record_id,
            IntegrationFailedRecord.company_id == company_id
        )
        .first()
    )

    if not record:
        raise HTTPException(404, "Failed record not found")

    if record.processing_status == "Retry Requested":
        raise HTTPException(400, "Retry already requested")

    record.processing_status = "Retry Requested"
    record.retry_count += 1

    db.commit()

    return {
        "message": "Record queued for retry processing",
        "record_id": record.id,
        "retry_count": record.retry_count
    }
