from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)

    inventory_id = Column(
        Integer,
        ForeignKey("inventory.id"),
        nullable=False
    )

    movement_type = Column(String)

    quantity_changed = Column(Integer)

    previous_quantity = Column(Integer)

    updated_quantity = Column(Integer)

    reason = Column(String)

    remarks = Column(String)

    performed_by = Column(Integer)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )