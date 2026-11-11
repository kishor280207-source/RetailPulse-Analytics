
from sqlalchemy.orm import Session

from app.models.integration import (
    Integration,
    IntegrationSync,
    IntegrationFailedRecord,
    IntegrationSchedule,
    IntegrationCheckpoint
)


def get_integrations(db: Session, company_id: int):
    return (
        db.query(Integration)
        .filter(Integration.company_id == company_id)
        .order_by(Integration.created_at.desc())
        .all()
    )


def get_integration(db: Session, integration_id: int, company_id: int):
    return (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.company_id == company_id
        )
        .first()
    )


def create_integration(db: Session, integration):
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return integration


def update_integration(db: Session, integration):
    db.commit()
    db.refresh(integration)
    return integration


def get_sync_history(db: Session, integration_id: int, company_id: int):
    return (
        db.query(IntegrationSync)
        .filter(
            IntegrationSync.integration_id == integration_id,
            IntegrationSync.company_id == company_id
        )
        .order_by(IntegrationSync.created_at.desc())
        .all()
    )


def get_failed_records(db: Session, integration_id: int, company_id: int):
    return (
        db.query(IntegrationFailedRecord)
        .filter(
            IntegrationFailedRecord.integration_id == integration_id,
            IntegrationFailedRecord.company_id == company_id
        )
        .order_by(IntegrationFailedRecord.created_at.desc())
        .all()
    )


def get_schedule(db: Session, integration_id: int, company_id: int):
    return (
        db.query(IntegrationSchedule)
        .filter(
            IntegrationSchedule.integration_id == integration_id,
            IntegrationSchedule.company_id == company_id
        )
        .first()
    )


def get_checkpoint(db: Session, integration_id: int, company_id: int):
    return (
        db.query(IntegrationCheckpoint)
        .filter(
            IntegrationCheckpoint.integration_id == integration_id,
            IntegrationCheckpoint.company_id == company_id
        )
        .first()
    )
