
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    JSON,
    Float,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.database.database import Base



class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    name = Column(String(150), nullable=False)

    source_type = Column(String(50), nullable=False)

    target_module = Column(String(50), nullable=False)

    authentication_method = Column(
        String(50),
        default="None"
    )

    connection_config = Column(JSON, default=dict)

    encrypted_credentials = Column(Text, nullable=True)

    field_mappings = Column(JSON, default=list)

    duplicate_strategy = Column(
        String(50),
        default="skip"
    )

    sync_frequency = Column(
        String(50),
        default="manual"
    )

    status = Column(
        String(30),
        default="inactive"
    )

    is_operational = Column(Boolean, default=False)

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    last_sync_at = Column(DateTime(timezone=True))



class IntegrationSync(Base):
    __tablename__ = "integration_syncs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    integration_id = Column(
        Integer,
        ForeignKey("integrations.id"),
        nullable=False
    )

    triggered_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    status = Column(
        String(40),
        default="Pending"
    )

    started_at = Column(DateTime(timezone=True))

    completed_at = Column(DateTime(timezone=True))

    duration_seconds = Column(Float, default=0)

    records_processed = Column(Integer, default=0)

    records_inserted = Column(Integer, default=0)

    records_updated = Column(Integer, default=0)

    records_skipped = Column(Integer, default=0)

    records_failed = Column(Integer, default=0)

    error_message = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )



class IntegrationFailedRecord(Base):
    __tablename__ = "integration_failed_records"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    integration_id = Column(
        Integer,
        ForeignKey("integrations.id"),
        nullable=False
    )

    sync_id = Column(
        Integer,
        ForeignKey("integration_syncs.id"),
        nullable=False
    )

    source_record_id = Column(String(150))

    row_number = Column(Integer)

    error_category = Column(String(100))

    error_message = Column(Text)

    raw_record = Column(JSON)

    processing_status = Column(
        String(30),
        default="Failed"
    )

    retry_count = Column(Integer, default=0)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )



class IntegrationSchedule(Base):
    __tablename__ = "integration_schedules"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    integration_id = Column(
        Integer,
        ForeignKey("integrations.id"),
        nullable=False,
        unique=True
    )

    frequency = Column(String(30), nullable=False)

    execution_time = Column(String(20))

    day_of_week = Column(Integer, nullable=True)

    timezone = Column(
        String(80),
        default="Asia/Kolkata"
    )

    is_active = Column(Boolean, default=True)

    next_run_at = Column(DateTime(timezone=True))

    last_run_at = Column(DateTime(timezone=True))

    previous_result = Column(String(50))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )



class IntegrationCheckpoint(Base):
    __tablename__ = "integration_checkpoints"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    integration_id = Column(
        Integer,
        ForeignKey("integrations.id"),
        nullable=False
    )

    checkpoint_value = Column(String(255))

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "integration_id",
            name="uq_integration_checkpoint"
        ),
    )
