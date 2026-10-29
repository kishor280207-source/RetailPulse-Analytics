from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    role_name = Column(String, nullable=False)
    module = Column(String, nullable=False)

    can_view = Column(Boolean, default=False)
    can_create = Column(Boolean, default=False)
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_export = Column(Boolean, default=False)
    can_approve = Column(Boolean, default=False)
    can_manage_access = Column(Boolean, default=False)

    updated_by = Column(Integer, nullable=True)
    updated_by_name = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
