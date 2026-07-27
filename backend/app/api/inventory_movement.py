from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement

router = APIRouter(
    prefix="/inventory-movements",
    tags=["Inventory Movements"]
)


@router.get("/")
def get_inventory_movements(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return (
        db.query(InventoryMovement)
        .join(
            Inventory,
            Inventory.id == InventoryMovement.inventory_id
        )
        .filter(
            Inventory.company_id == user["company_id"]
        )
        .order_by(
            InventoryMovement.created_at.desc()
        )
        .all()
    )