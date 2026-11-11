
from datetime import datetime, time
from typing import Optional, Any, Literal

from pydantic import BaseModel, Field, ConfigDict, field_validator



class FieldMapping(BaseModel):
    source_field: str
    target_field: str
    required: bool = False
    data_type: Optional[str] = None



class IntegrationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)

    source_type: Literal["CSV", "PostgreSQL", "REST API"]

    target_module: Literal[
        "Products",
        "Inventory",
        "Sales",
        "Customers"
    ]

    authentication_method: str = "None"

    connection_config: dict[str, Any] = Field(default_factory=dict)

    credentials: Optional[dict[str, Any]] = None

    sync_frequency: str = "manual"

    duplicate_strategy: Literal[
        "insert",
        "update",
        "skip",
        "reject"
    ] = "skip"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        return value.strip()


class IntegrationUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    connection_config: Optional[dict[str, Any]] = None

    authentication_method: Optional[str] = None

    credentials: Optional[dict[str, Any]] = None

    target_module: Optional[str] = None

    sync_frequency: Optional[str] = None

    duplicate_strategy: Optional[
        Literal["insert", "update", "skip", "reject"]
    ] = None



class IntegrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    name: str
    source_type: str
    target_module: str
    authentication_method: Optional[str]
    connection_config: Optional[dict[str, Any]]
    field_mappings: Optional[list]
    duplicate_strategy: Optional[str]
    sync_frequency: Optional[str]
    status: str
    is_operational: bool
    created_by: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    last_sync_at: Optional[datetime]



class IntegrationStatusUpdate(BaseModel):
    status: Literal["active", "inactive"]



class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    details: Optional[str] = None



class MappingConfiguration(BaseModel):
    mappings: list[FieldMapping]


class MappingValidationResponse(BaseModel):
    valid: bool
    message: str
    errors: list[str] = Field(default_factory=list)



class SyncRequest(BaseModel):
    mode: Literal["initial", "incremental"] = "initial"



class SyncResponse(BaseModel):
    sync_id: int
    integration_id: int
    status: str
    records_processed: int = 0
    records_inserted: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    records_failed: int = 0
    message: Optional[str] = None



class SyncHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    integration_id: int
    triggered_by: Optional[int]
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    records_processed: int
    records_inserted: int
    records_updated: int
    records_skipped: int
    records_failed: int
    error_message: Optional[str]



class FailedRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    integration_id: int
    sync_id: int
    source_record_id: Optional[str]
    row_number: Optional[int]
    error_category: Optional[str]
    error_message: Optional[str]
    processing_status: str
    retry_count: int



class IntegrationScheduleCreate(BaseModel):
    frequency: Literal["daily", "weekly"]

    execution_time: time

    day_of_week: Optional[int] = Field(
        default=None,
        ge=0,
        le=6
    )

    timezone: str = "Asia/Kolkata"

    is_active: bool = True

    @field_validator("day_of_week")
    @classmethod
    def validate_weekly_day(cls, value, info):
        if info.data.get("frequency") == "weekly" and value is None:
            raise ValueError(
                "day_of_week is required for weekly schedules"
            )
        return value


class IntegrationScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    integration_id: int
    frequency: str
    execution_time: Optional[str]
    day_of_week: Optional[int]
    timezone: Optional[str]
    is_active: bool
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    previous_result: Optional[str]



class IntegrationDashboardResponse(BaseModel):
    total_integrations: int = 0
    active_integrations: int = 0
    inactive_integrations: int = 0
    failed_integrations: int = 0
    pending_jobs: int = 0
    successful_records: int = 0
    failed_records: int = 0
    last_sync_at: Optional[datetime] = None
