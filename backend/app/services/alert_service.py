from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.inventory import Inventory
from app.services.notification_service import create_notification
from datetime import datetime
from app.models.notification import Notification

def evaluate_product_stock_alert(db: Session, company_id: int, product: Product):
    """
    Checks a single product's stock level right after it changes (e.g. after
    a sale) and creates the appropriate alert if needed. This is called
    inline after stock-affecting operations rather than on a schedule,
    since this project has no background job runner - evaluating at the
    moment of change is simpler and catches every real stock change.
    """
    inventory = (
        db.query(Inventory)
        .filter(Inventory.product_id == product.id, Inventory.company_id == company_id)
        .first()
    )

    reorder_level = inventory.reorder_level if inventory else 10
    current_stock = product.stock_quantity or 0

    dedup_key = f"stock:{product.id}"

    if current_stock <= 0:
        create_notification(
            db=db,
            company_id=company_id,
            type="StockoutRisk",
            priority="Critical",
            title="Product Out of Stock",
            message=f"{product.name} has reached 0 stock.",
            resource_type="Product",
            resource_id=product.id,
            dedup_key=dedup_key,
        )
    elif current_stock <= reorder_level:
        create_notification(
            db=db,
            company_id=company_id,
            type="LowStock",
            priority="High" if current_stock <= reorder_level / 2 else "Medium",
            title="Low Stock Alert",
            message=f"{product.name} has only {current_stock} units remaining (reorder level: {reorder_level}).",
            resource_type="Product",
            resource_id=product.id,
            dedup_key=dedup_key,
        )
    elif current_stock > reorder_level * 5:
        create_notification(
            db=db,
            company_id=company_id,
            type="Overstock",
            priority="Low",
            title="Overstock Detected",
            message=f"{product.name} has {current_stock} units, significantly above typical demand.",
            resource_type="Product",
            resource_id=product.id,
            dedup_key=dedup_key,
        )
    else:
        (
            db.query(Notification)
            .filter(
                Notification.company_id == company_id,
                Notification.dedup_key == dedup_key,
                Notification.is_read == False,
            )
            .update({"expires_at": datetime.utcnow(), "is_read": True}, synchronize_session=False)
        )
        db.commit()    