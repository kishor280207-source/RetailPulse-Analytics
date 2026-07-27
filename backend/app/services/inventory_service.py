from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate, InventoryUpdate
from sqlalchemy import func
from app.models.product import Product
from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log

def calculate_stock_status(available_stock: int, reorder_level: int):
    if available_stock == 0:
        return "Out of Stock"
    elif available_stock <= reorder_level:
        return "Low Stock"
    return "In Stock"


def create_inventory(
    db: Session,
    data: InventoryCreate,
    company_id: int
):
    available_stock = data.current_stock - data.reserved_stock

    if available_stock < 0:
        raise HTTPException(
            status_code=400,
            detail="Available stock cannot be negative"
        )

    status = calculate_stock_status(
        available_stock,
        data.reorder_level
    )

    inventory = Inventory(
        company_id=company_id,
        product_id=data.product_id,
        current_stock=data.current_stock,
        reserved_stock=data.reserved_stock,
        available_stock=available_stock,
        reorder_level=data.reorder_level,
        stock_status=status
    )

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory


def get_inventory(
    db: Session,
    company_id: int
):
    return (
        db.query(Inventory)
        .filter(Inventory.company_id == company_id)
        .all()
    )


def update_inventory(
    db: Session,
    inventory_id: int,
    data: InventoryUpdate,
    company_id: int
):
    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.id == inventory_id,
            Inventory.company_id == company_id
        )
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    available_stock = (
        data.current_stock -
        data.reserved_stock
    )

    if available_stock < 0:
        raise HTTPException(
            status_code=400,
            detail="Available stock cannot be negative"
        )

    inventory.current_stock = data.current_stock
    inventory.reserved_stock = data.reserved_stock
    inventory.available_stock = available_stock
    inventory.reorder_level = data.reorder_level
    inventory.stock_status = calculate_stock_status(
        available_stock,
        data.reorder_level
    )

    db.commit()
    db.refresh(inventory)

    return inventory
def add_stock(
    db,
    inventory_id,
    data,
    company_id,
    user_id
):
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.company_id == company_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    inventory.current_stock += data.quantity
    inventory.available_stock = (
        inventory.current_stock -
        inventory.reserved_stock
    )

    inventory.stock_status = calculate_stock_status(
        inventory.available_stock,
        inventory.reorder_level
    )

    db.commit()
    create_audit_log(
    db=db,
    company=str(company_id),
    user=str(user_id),
    action="Stock Added",
    ip="127.0.0.1",
    browser="Swagger"
)
    db.refresh(inventory)

    return inventory


def remove_stock(
    db,
    inventory_id,
    data,
    company_id,
    user_id
):
    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.company_id == company_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    if inventory.available_stock < data.quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    inventory.current_stock -= data.quantity
    inventory.available_stock = (
        inventory.current_stock -
        inventory.reserved_stock
    )

    inventory.stock_status = calculate_stock_status(
        inventory.available_stock,
        inventory.reorder_level
    )

    db.commit()
    create_audit_log(
    db=db,
    company=str(company_id),
    user=str(user_id),
    action="Stock Removed",
    ip="127.0.0.1",
    browser="Swagger"
)
    db.refresh(inventory)

    return inventory
def get_inventory_dashboard(
    db: Session,
    company_id: int
):
    total_products = (
        db.query(Inventory)
        .filter(Inventory.company_id == company_id)
        .count()
    )

    total_quantity = (
        db.query(func.sum(Inventory.current_stock))
        .filter(Inventory.company_id == company_id)
        .scalar()
    )

    if total_quantity is None:
        total_quantity = 0

    low_stock = (
        db.query(Inventory)
        .filter(
            Inventory.company_id == company_id,
            Inventory.stock_status == "Low Stock"
        )
        .count()
    )

    out_of_stock = (
        db.query(Inventory)
        .filter(
            Inventory.company_id == company_id,
            Inventory.stock_status == "Out of Stock"
        )
        .count()
    )

    return {
        "total_products": total_products,
        "total_inventory_quantity": total_quantity,
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock
    }
def search_inventory(
    db: Session,
    company_id: int,
    product_name: str = None,
    sku: str = None,
    stock_status: str = None,
    brand: str = None
):

    query = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.company_id == company_id)
    )

    if product_name:
        query = query.filter(
            Product.name.ilike(f"%{product_name}%")
        )

    if sku:
        query = query.filter(
            Product.sku.ilike(f"%{sku}%")
        )

    if stock_status:
        query = query.filter(
            Inventory.stock_status == stock_status
        )
    if inventory.stock_status == "Low Stock":
       create_notification(
          db=db,
          company_id=company_id,
          title="Low Stock",
          message="Product stock is running low."
    )

    if inventory.stock_status == "Out of Stock":
       create_notification(
          db=db,
          company_id=company_id,
          title="Out Of Stock",
          message="Product is now Out Of Stock."
    )    

    if brand:
        query = query.filter(
            Product.brand.ilike(f"%{brand}%")
        )

    return query.all()