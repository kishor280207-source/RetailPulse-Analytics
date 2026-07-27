from sqlalchemy.orm import Session

from app.models.inventory_movement import InventoryMovement


def create_inventory_movement(
    db: Session,
    inventory_id: int,
    movement_type: str,
    previous_quantity: int,
    updated_quantity: int,
    quantity_changed: int,
    reason: str,
    remarks: str,
    performed_by: str
):
    movement = InventoryMovement(
        inventory_id=inventory_id,
        movement_type=movement_type,
        previous_quantity=previous_quantity,
        updated_quantity=updated_quantity,
        quantity_changed=quantity_changed,
        reason=reason,
        remarks=remarks,
        performed_by=performed_by
    )

    db.add(movement)
    db.commit()
    db.refresh(movement)

    return movement