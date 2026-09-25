import json
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement


def check_sale_quantity_exceeds_stock(db: Session, company_id: int):
    """Sales where quantity sold exceeds what was in stock (using current stock + already-sold as a proxy)."""
    issues = []
    items = (
        db.query(SaleItem, Sale, Product)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .join(Product, Product.id == SaleItem.product_id)
        .filter(Sale.company_id == company_id)
        .all()
    )
    for item, sale, product in items:
        if product and item.quantity > (product.stock_quantity + item.quantity) and product.stock_quantity < 0:
            issues.append({
                "issue_type": "SaleExceedsStock",
                "severity": "High",
                "affected_module": "Sales",
                "affected_record_id": sale.id,
                "description": f"Sale {sale.invoice_number} for {product.name}: quantity {item.quantity} resulted in negative stock.",
                "details": {"product_id": product.id, "current_stock": product.stock_quantity, "sold_quantity": item.quantity},
                "dedup_key": f"sale_exceeds_stock:{sale.id}:{product.id}",
            })
    return issues, len(items)


def check_inventory_movement_consistency(db: Session, company_id: int):
    """Stock movements where previous_quantity + quantity_changed != updated_quantity."""
    issues = []
    movements = (
        db.query(InventoryMovement, Inventory)
        .join(Inventory, Inventory.id == InventoryMovement.inventory_id)
        .filter(Inventory.company_id == company_id)
        .all()
    )
    for movement, inventory in movements:
        expected = (movement.previous_quantity or 0) + (movement.quantity_changed or 0)
        if expected != movement.updated_quantity:
            issues.append({
                "issue_type": "InventoryMovementMismatch",
                "severity": "Medium",
                "affected_module": "Inventory",
                "affected_record_id": movement.id,
                "description": f"Movement #{movement.id}: previous ({movement.previous_quantity}) + change ({movement.quantity_changed}) = {expected}, but recorded as {movement.updated_quantity}.",
                "details": {"expected": expected, "actual": movement.updated_quantity, "movement_id": movement.id},
                "dedup_key": f"movement_mismatch:{movement.id}",
            })
    return issues, len(movements)


def check_sales_referencing_invalid_products(db: Session, company_id: int):
    """Sale items referencing a product that doesn't exist or is inactive."""
    issues = []
    items = (
        db.query(SaleItem, Sale)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
        .all()
    )
    for item, sale in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            issues.append({
                "issue_type": "InvalidProductReference",
                "severity": "Critical",
                "affected_module": "Sales",
                "affected_record_id": sale.id,
                "description": f"Sale {sale.invoice_number} references product ID {item.product_id}, which no longer exists.",
                "details": {"product_id": item.product_id, "sale_id": sale.id},
                "dedup_key": f"invalid_product:{sale.id}:{item.product_id}",
            })
        elif product.status == "Inactive":
            issues.append({
                "issue_type": "InactiveProductReference",
                "severity": "Low",
                "affected_module": "Sales",
                "affected_record_id": sale.id,
                "description": f"Sale {sale.invoice_number} references inactive product {product.name}.",
                "details": {"product_id": product.id, "sale_id": sale.id},
                "dedup_key": f"inactive_product:{sale.id}:{product.id}",
            })
    return issues, len(items)


def check_sales_referencing_invalid_customers(db: Session, company_id: int):
    """Sales referencing a customer that doesn't exist."""
    issues = []
    sales = db.query(Sale).filter(Sale.company_id == company_id).all()
    for sale in sales:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
        if not customer:
            issues.append({
                "issue_type": "InvalidCustomerReference",
                "severity": "High",
                "affected_module": "Sales",
                "affected_record_id": sale.id,
                "description": f"Sale {sale.invoice_number} references customer ID {sale.customer_id}, which no longer exists.",
                "details": {"customer_id": sale.customer_id, "sale_id": sale.id},
                "dedup_key": f"invalid_customer:{sale.id}",
            })
    return issues, len(sales)


def check_duplicate_skus(db: Session, company_id: int):
    """Products sharing the same SKU within a company."""
    issues = []
    products = db.query(Product).filter(Product.company_id == company_id).all()
    seen = {}
    for p in products:
        if p.sku in seen:
            issues.append({
                "issue_type": "DuplicateSKU",
                "severity": "Medium",
                "affected_module": "Products",
                "affected_record_id": p.id,
                "description": f"Products '{p.name}' (ID {p.id}) and '{seen[p.sku].name}' (ID {seen[p.sku].id}) share SKU '{p.sku}'.",
                "details": {"sku": p.sku, "product_ids": [p.id, seen[p.sku].id]},
                "dedup_key": f"duplicate_sku:{p.sku}",
            })
        else:
            seen[p.sku] = p
    return issues, len(products)


def check_missing_mandatory_info(db: Session, company_id: int):
    """Products/Customers missing required fields."""
    issues = []
    checked = 0

    products = db.query(Product).filter(Product.company_id == company_id).all()
    for p in products:
        checked += 1
        if not p.name or not p.sku:
            issues.append({
                "issue_type": "MissingMandatoryInfo",
                "severity": "Medium",
                "affected_module": "Products",
                "affected_record_id": p.id,
                "description": f"Product ID {p.id} is missing required name or SKU.",
                "details": {"product_id": p.id},
                "dedup_key": f"missing_info_product:{p.id}",
            })

    customers = db.query(Customer).filter(Customer.company_id == company_id).all()
    for c in customers:
        checked += 1
        if not c.full_name or not c.email:
            issues.append({
                "issue_type": "MissingMandatoryInfo",
                "severity": "Medium",
                "affected_module": "Customers",
                "affected_record_id": c.id,
                "description": f"Customer ID {c.id} is missing required name or email.",
                "details": {"customer_id": c.id},
                "dedup_key": f"missing_info_customer:{c.id}",
            })

    return issues, checked


def check_report_totals_match(db: Session, company_id: int):
    """Sale.total_amount should equal subtotal - discount + tax."""
    issues = []
    sales = db.query(Sale).filter(Sale.company_id == company_id).all()
    for sale in sales:
        expected = round((sale.subtotal or 0) - (sale.discount or 0) + (sale.tax or 0), 2)
        actual = round(sale.total_amount or 0, 2)
        if abs(expected - actual) > 0.01:
            issues.append({
                "issue_type": "ReportTotalMismatch",
                "severity": "High",
                "affected_module": "Reports",
                "affected_record_id": sale.id,
                "description": f"Sale {sale.invoice_number}: expected total {expected}, recorded total {actual}.",
                "details": {"expected": expected, "actual": actual, "sale_id": sale.id},
                "dedup_key": f"total_mismatch:{sale.id}",
            })
    return issues, len(sales)


ALL_CHECKS = [
    check_sale_quantity_exceeds_stock,
    check_inventory_movement_consistency,
    check_sales_referencing_invalid_products,
    check_sales_referencing_invalid_customers,
    check_duplicate_skus,
    check_missing_mandatory_info,
    check_report_totals_match,
]