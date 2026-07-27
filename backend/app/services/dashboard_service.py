from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory


def get_dashboard_summary(db: Session):

    total_revenue = (
        db.query(func.sum(Sale.total_amount)).scalar() or 0
    )

    total_orders = db.query(Sale).count()

    total_products_sold = (
        db.query(func.sum(SaleItem.quantity)).scalar() or 0
    )

    average_order_value = 0

    if total_orders > 0:
        average_order_value = total_revenue / total_orders

    inventory_value = (
        db.query(
            func.sum(
                Inventory.available_stock * Product.selling_price
            )
        )
        .join(Product, Product.id == Inventory.product_id)
        .scalar() or 0
    )

    low_stock_products = (
        db.query(Inventory)
        .filter(
            Inventory.available_stock <= Inventory.reorder_level
        )
        .count()
    )

    out_of_stock_products = (
        db.query(Inventory)
        .filter(
            Inventory.available_stock == 0
        )
        .count()
    )

    total_categories = db.query(Category).count()

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products_sold": total_products_sold,
        "average_order_value": average_order_value,
        "inventory_value": inventory_value,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "total_categories": total_categories,
    }


def get_revenue_trend(db: Session):

    data = (
        db.query(
            Sale.sale_date,
            func.sum(Sale.total_amount).label("revenue")
        )
        .group_by(Sale.sale_date)
        .order_by(Sale.sale_date)
        .all()
    )

    return [
        {
            "date": row.sale_date.strftime("%Y-%m-%d"),
            "revenue": float(row.revenue)
        }
        for row in data
    ]
def get_top_products(db: Session):

    products = (
        db.query(
            Product.name,
            func.sum(SaleItem.quantity).label("quantity")
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .group_by(Product.name)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(10)
        .all()
    )

    return [
        {
            "product": p.name,
            "quantity": int(p.quantity)
        }
        for p in products
    ]
def get_recent_sales(db: Session):

    sales = (
        db.query(Sale)
        .order_by(Sale.id.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": sale.id,
            "customer": sale.customer_name,
            "amount": sale.total_amount,
            "date": sale.sale_date
        }
        for sale in sales
    ]
def get_inventory_category(db: Session):

    data = (
        db.query(
            Category.name,
            func.sum(Inventory.available_stock).label("stock")
        )
        .join(Product, Product.category_id == Category.id)
        .join(Inventory, Inventory.product_id == Product.id)
        .group_by(Category.name)
        .all()
    )

    return [
        {
            "category": row.name,
            "stock": int(row.stock)
        }
        for row in data
    ]