import json
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from app.models.inventory import Inventory
from app.models.report_history import ReportHistory


def generate_sales_report(db: Session, company_id: int, filters: dict):
    query = db.query(Sale).filter(Sale.company_id == company_id)

    if filters.get("start_date"):
        query = query.filter(Sale.sale_date >= filters["start_date"])
    if filters.get("end_date"):
        query = query.filter(Sale.sale_date <= filters["end_date"])
    if filters.get("customer_id"):
        query = query.filter(Sale.customer_id == filters["customer_id"])
    if filters.get("status"):
        query = query.filter(Sale.status == filters["status"])
    if filters.get("product_id") or filters.get("category_id"):
        query = query.join(SaleItem, SaleItem.sale_id == Sale.id)
        if filters.get("product_id"):
            query = query.filter(SaleItem.product_id == filters["product_id"])
        if filters.get("category_id"):
            query = query.filter(SaleItem.category_id == filters["category_id"])

    sales = query.order_by(Sale.sale_date.desc()).all()

    return [
        {
            "invoice_number": s.invoice_number,
            "customer_name": s.customer_name,
            "sale_date": s.sale_date.isoformat() if s.sale_date else None,
            "payment_method": s.payment_method,
            "subtotal": s.subtotal,
            "discount": s.discount,
            "tax": s.tax,
            "total_amount": s.total_amount,
            "status": s.status,
        }
        for s in sales
    ]


def generate_inventory_report(db: Session, company_id: int, filters: dict):
    query = db.query(Product).filter(Product.company_id == company_id)

    if filters.get("category_id"):
        query = query.filter(Product.category_id == filters["category_id"])
    if filters.get("brand"):
        query = query.filter(Product.brand.ilike(f"%{filters['brand']}%"))
    if filters.get("stock_status"):
        query = query.filter(Product.status == filters["stock_status"])

    products = query.all()

    result = []
    for p in products:
        category = db.query(Category).filter(Category.id == p.category_id).first()
        result.append({
            "product_name": p.name,
            "sku": p.sku,
            "brand": p.brand,
            "category": category.name if category else "-",
            "stock_quantity": p.stock_quantity,
            "unit_price": p.unit_price,
            "cost_price": p.cost_price,
            "status": p.status,
        })
    return result


def generate_customer_report(db: Session, company_id: int, filters: dict):
    query = db.query(Customer).filter(Customer.company_id == company_id)

    if filters.get("customer_id"):
        query = query.filter(Customer.id == filters["customer_id"])

    customers = query.all()

    result = []
    for c in customers:
        sales_query = db.query(Sale).filter(Sale.company_id == company_id, Sale.customer_id == c.id)
        if filters.get("start_date"):
            sales_query = sales_query.filter(Sale.sale_date >= filters["start_date"])
        if filters.get("end_date"):
            sales_query = sales_query.filter(Sale.sale_date <= filters["end_date"])

        order_count = sales_query.count()
        total_spend = sales_query.with_entities(func.sum(Sale.total_amount)).scalar() or 0

        result.append({
            "customer_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "order_count": order_count,
            "total_spend": float(total_spend),
        })
    return result


def generate_product_performance_report(db: Session, company_id: int, filters: dict):
    query = (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(SaleItem.quantity).label("units_sold"),
            func.sum(SaleItem.total).label("revenue"),
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )

    if filters.get("start_date"):
        query = query.filter(Sale.sale_date >= filters["start_date"])
    if filters.get("end_date"):
        query = query.filter(Sale.sale_date <= filters["end_date"])
    if filters.get("category_id"):
        query = query.filter(SaleItem.category_id == filters["category_id"])
    if filters.get("brand"):
        query = query.filter(Product.brand.ilike(f"%{filters['brand']}%"))

    results = query.group_by(Product.id, Product.name, Product.sku).order_by(func.sum(SaleItem.total).desc()).all()

    return [
        {
            "product_name": r.name,
            "sku": r.sku,
            "units_sold": r.units_sold,
            "revenue": float(r.revenue or 0),
        }
        for r in results
    ]


def generate_stock_movement_report(db: Session, company_id: int, filters: dict):
    query = (
        db.query(InventoryMovement, Product)
        .join(Inventory, Inventory.id == InventoryMovement.inventory_id)
        .join(Product, Product.id == Inventory.product_id)
        .filter(Inventory.company_id == company_id)
    )

    if filters.get("start_date"):
        query = query.filter(InventoryMovement.created_at >= filters["start_date"])
    if filters.get("end_date"):
        query = query.filter(InventoryMovement.created_at <= filters["end_date"])
    if filters.get("product_id"):
        query = query.filter(Product.id == filters["product_id"])

    results = query.order_by(InventoryMovement.created_at.desc()).all()

    return [
        {
            "product_name": product.name,
            "sku": product.sku,
            "movement_type": movement.movement_type,
            "quantity_changed": movement.quantity_changed,
            "previous_quantity": movement.previous_quantity,
            "updated_quantity": movement.updated_quantity,
            "reason": movement.reason,
            "date": movement.created_at.isoformat() if movement.created_at else None,
        }
        for movement, product in results
    ]


REPORT_GENERATORS = {
    "Sales": generate_sales_report,
    "Inventory": generate_inventory_report,
    "Customer": generate_customer_report,
    "ProductPerformance": generate_product_performance_report,
    "StockMovement": generate_stock_movement_report,
}


def generate_report(db: Session, company_id: int, user_id: int, user_name: str, report_type: str, filters: dict, export_format: str = "View"):
    generator = REPORT_GENERATORS.get(report_type)

    if not generator:
        raise ValueError(f"Unknown report type: {report_type}")

    try:
        data = generator(db, company_id, filters)
        status = "Completed"
        error_message = None
    except Exception as e:
        data = []
        status = "Failed"
        error_message = str(e)

    history = ReportHistory(
        company_id=company_id,
        generated_by=user_id,
        generated_by_name=user_name,
        report_type=report_type,
        filters_applied=json.dumps(filters, default=str),
        format=export_format,
        status=status,
        error_message=error_message,
        record_count=len(data),
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    if status == "Failed":
        raise ValueError(error_message)

    return {
        "report_id": history.id,
        "report_type": report_type,
        "filters_applied": filters,
        "generated_at": history.generated_at,
        "record_count": len(data),
        "data": data,
    }