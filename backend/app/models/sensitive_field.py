from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class SensitiveFieldConfig(Base):
    __tablename__ = "sensitive_fields_config"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    module = Column(String, nullable=False)
    field_name = Column(String, nullable=False)
    protection_level = Column(String, default="Masked")  
    allowed_roles = Column(String, nullable=True)  

    updated_by = Column(Integer, nullable=True)
    updated_by_name = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
