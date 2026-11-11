
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, time, timezone

from app.database.database import get_db
from app.api.auth import get_current_user

from app.models.integration import (
    Integration,
    IntegrationSync,
    IntegrationFailedRecord,
    IntegrationSchedule
)

from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    IntegrationStatusUpdate,
    ConnectionTestResponse,
    MappingConfiguration,
    MappingValidationResponse,
    SyncRequest,
    SyncResponse,
    IntegrationScheduleCreate,
    IntegrationScheduleResponse,
    IntegrationDashboardResponse
)

from app.services.integrations.security import (
    encrypt_credentials,
    decrypt_credentials
)

from app.services.integrations.sync_service import run_csv_sync

from app.services.integrations.postgres_connector import (
    test_postgres_connection
)

from app.services.integrations.rest_connector import (
    test_rest_connection
)
from zoneinfo import ZoneInfo


router = APIRouter()


def user_details(user):
    if isinstance(user, dict):
        return user["company_id"], user.get("user_id")

    return user.company_id, user.id


def get_owned_integration(db, integration_id, company_id):
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.company_id == company_id
        )
        .first()
    )

    if not integration:
        raise HTTPException(404, "Integration not found")

    return integration


@router.get("/", response_model=list[IntegrationResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    return (
        db.query(Integration)
        .filter(Integration.company_id == company_id)
        .order_by(Integration.created_at.desc())
        .all()
    )


@router.post("/", response_model=IntegrationResponse)
def create_integration(
    payload: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, user_id = user_details(current_user)

    integration = Integration(
        company_id=company_id,
        created_by=user_id,
        name=payload.name,
        source_type=payload.source_type,
        target_module=payload.target_module,
        authentication_method=payload.authentication_method,
        connection_config=payload.connection_config,
        encrypted_credentials=encrypt_credentials(
            payload.credentials
        ),
        sync_frequency=payload.sync_frequency,
        duplicate_strategy=payload.duplicate_strategy,
        field_mappings=[]
    )

    db.add(integration)
    db.commit()
    db.refresh(integration)

    return integration


@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    return get_owned_integration(
        db, integration_id, company_id
    )


@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(
    integration_id: int,
    payload: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    data = payload.model_dump(exclude_unset=True)

    credentials = data.pop("credentials", None)

    for key, value in data.items():
        setattr(integration, key, value)

    if credentials is not None:
        integration.encrypted_credentials = encrypt_credentials(
            credentials
        )

    db.commit()
    db.refresh(integration)

    return integration


@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    db.delete(integration)
    db.commit()

    return {"message": "Integration deleted successfully"}


@router.patch("/{integration_id}/status")
def update_status(
    integration_id: int,
    payload: IntegrationStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    integration.status = payload.status

    db.commit()

    return {"message": "Integration status updated"}


@router.put("/{integration_id}/mapping")
def save_mapping(
    integration_id: int,
    payload: MappingConfiguration,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    integration.field_mappings = [
        item.model_dump()
        for item in payload.mappings
    ]

    db.commit()

    return {"message": "Field mappings saved successfully"}


@router.post("/{integration_id}/mapping/validate")
def validate_mapping(
    integration_id: int,
    payload: MappingConfiguration,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    errors = []

    sources = [item.source_field for item in payload.mappings]
    targets = [item.target_field for item in payload.mappings]

    if len(sources) != len(set(sources)):
        errors.append("Duplicate source fields")

    if len(targets) != len(set(targets)):
        errors.append("Duplicate target fields")

    if integration.target_module == "Products":
        required = {"name", "sku"}

        mapped = set(targets)

        if not required.issubset(mapped):
            errors.append("Product name and SKU mappings are required")

    return MappingValidationResponse(
        valid=len(errors) == 0,
        message=(
            "Mapping is valid"
            if not errors
            else "Mapping validation failed"
        ),
        errors=errors
    )


@router.post("/{integration_id}/test", response_model=ConnectionTestResponse)
def test_connection(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    credentials = decrypt_credentials(
        integration.encrypted_credentials
    )

    if integration.source_type == "PostgreSQL":
        result = test_postgres_connection({
            **(integration.connection_config or {}),
            **credentials
        })

    elif integration.source_type == "REST API":
        result = test_rest_connection(
            integration.connection_config or {},
            credentials
        )

    elif integration.source_type == "CSV":
        result = {
            "success": True,
            "message": "CSV connector is ready for file upload"
        }

    else:
        raise HTTPException(400, "Unsupported source type")

    return ConnectionTestResponse(**result)


@router.post("/{integration_id}/sync", response_model=SyncResponse)
def synchronize_csv(
    integration_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, user_id = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    if integration.source_type != "CSV":
        raise HTTPException(
            400,
            "File upload synchronization is available for CSV only"
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    content = file.file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Maximum CSV file size is 10 MB")

    sync = run_csv_sync(
        db=db,
        integration=integration,
        company_id=company_id,
        user_id=user_id,
        file_content=content
    )

    return SyncResponse(
        sync_id=sync.id,
        integration_id=integration.id,
        status=sync.status,
        records_processed=sync.records_processed,
        records_inserted=sync.records_inserted,
        records_updated=sync.records_updated,
        records_skipped=sync.records_skipped,
        records_failed=sync.records_failed,
        message="Synchronization finished"
    )


@router.get("/{integration_id}/history")
def sync_history(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    get_owned_integration(db, integration_id, company_id)

    return (
        db.query(IntegrationSync)
        .filter(
            IntegrationSync.integration_id == integration_id,
            IntegrationSync.company_id == company_id
        )
        .order_by(IntegrationSync.created_at.desc())
        .all()
    )


@router.get("/{integration_id}/failed-records")
def failed_records(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    get_owned_integration(db, integration_id, company_id)

    return (
        db.query(IntegrationFailedRecord)
        .filter(
            IntegrationFailedRecord.integration_id == integration_id,
            IntegrationFailedRecord.company_id == company_id
        )
        .order_by(IntegrationFailedRecord.created_at.desc())
        .all()
    )


@router.get("/dashboard/summary", response_model=IntegrationDashboardResponse)
def integration_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integrations = (
        db.query(Integration)
        .filter(Integration.company_id == company_id)
        .all()
    )

    total = len(integrations)

    active = sum(1 for item in integrations if item.status == "active")
    inactive = total - active

    failed = (
        db.query(func.count(IntegrationSync.id))
        .filter(
            IntegrationSync.company_id == company_id,
            IntegrationSync.status == "Failed"
        )
        .scalar() or 0
    )

    successful = (
        db.query(func.sum(IntegrationSync.records_inserted))
        .filter(IntegrationSync.company_id == company_id)
        .scalar() or 0
    )

    failed_records = (
        db.query(func.count(IntegrationFailedRecord.id))
        .filter(IntegrationFailedRecord.company_id == company_id)
        .scalar() or 0
    )

    pending = (
        db.query(func.count(IntegrationSchedule.id))
        .filter(
            IntegrationSchedule.company_id == company_id,
            IntegrationSchedule.is_active == True
        )
        .scalar() or 0
    )

    last_sync = (
        db.query(func.max(IntegrationSync.completed_at))
        .filter(IntegrationSync.company_id == company_id)
        .scalar()
    )

    return IntegrationDashboardResponse(
        total_integrations=total,
        active_integrations=active,
        inactive_integrations=inactive,
        failed_integrations=failed,
        pending_jobs=pending,
        successful_records=int(successful),
        failed_records=failed_records,
        last_sync_at=last_sync
    )

@router.post("/{integration_id}/schedule")
def create_or_update_schedule(
    integration_id: int,
    payload: IntegrationScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    integration = get_owned_integration(
        db, integration_id, company_id
    )

    schedule = (
        db.query(IntegrationSchedule)
        .filter(
            IntegrationSchedule.integration_id == integration_id,
            IntegrationSchedule.company_id == company_id
        )
        .first()
    )

    zone = ZoneInfo(payload.timezone)

    now = datetime.now(zone)
    run_time = payload.execution_time

    next_run = datetime.combine(
        now.date(),
        run_time,
        tzinfo=zone
    )

    if payload.frequency == "weekly":
        days = (payload.day_of_week - now.weekday()) % 7
        next_run = next_run + timedelta(days=days)

    if next_run <= now:
        next_run += timedelta(
            days=1 if payload.frequency == "daily" else 7
        )

    if not schedule:
        schedule = IntegrationSchedule(
            company_id=company_id,
            integration_id=integration_id
        )

    schedule.frequency = payload.frequency
    schedule.execution_time = run_time.strftime("%H:%M")
    schedule.day_of_week = payload.day_of_week
    schedule.timezone = payload.timezone
    schedule.is_active = payload.is_active
    schedule.next_run_at = next_run.astimezone(timezone.utc)

    integration.sync_frequency = payload.frequency

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "message": "Schedule saved successfully",
        "schedule": IntegrationScheduleResponse.model_validate(
            schedule
        )
    }


@router.get("/{integration_id}/schedule")
def get_integration_schedule(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    get_owned_integration(db, integration_id, company_id)

    schedule = (
        db.query(IntegrationSchedule)
        .filter(
            IntegrationSchedule.integration_id == integration_id,
            IntegrationSchedule.company_id == company_id
        )
        .first()
    )

    if not schedule:
        raise HTTPException(404, "Schedule not found")

    return schedule


@router.delete("/{integration_id}/schedule")
def delete_integration_schedule(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    company_id, _ = user_details(current_user)

    schedule = (
        db.query(IntegrationSchedule)
        .filter(
            IntegrationSchedule.integration_id == integration_id,
            IntegrationSchedule.company_id == company_id
        )
        .first()
    )

    if not schedule:
        raise HTTPException(404, "Schedule not found")

    db.delete(schedule)
    db.commit()

    return {"message": "Schedule deleted successfully"}
