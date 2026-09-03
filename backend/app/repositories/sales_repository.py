from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product

from app.schemas.sales import SaleCreate

from app.services.invoice_service import generate_invoice_number
from sqlalchemy import func
from app.services.audit_service import create_audit_log
from app.services.notification_service import create_notification
from datetime import date
from datetime import datetime, timedelta
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.user import User

def _get_sale_ids_for_item_filters(db, company_id, product_id=None, category_id=None):
    if not product_id and not category_id:
        return None

    query = (
        db.query(SaleItem.sale_id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )

    if product_id:
        query = query.filter(SaleItem.product_id == product_id)

    if category_id:
        query = query.filter(SaleItem.category_id == category_id)

    return [row[0] for row in query.distinct().all()]

def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int
):
    user_record = db.query(User).filter(User.id == user_id).first()
    user_display_name = user_record.name if user_record else str(user_id)
    customer = (
    db.query(Customer)
    .filter(
        Customer.id == sale_data.customer_id,
        Customer.company_id == company_id
    )
    .first()
   )

    print("SALE CUSTOMER ID:", sale_data.customer_id)
    print("LOGGED COMPANY ID:", company_id)
    print("FOUND CUSTOMER:", customer)
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found."
        )

    invoice_number = generate_invoice_number(
        db,
        company_id
    )

    sale = Sale(
        company_id=company_id,
        invoice_number=invoice_number,
        customer_id=customer.id,
        customer_name=customer.full_name,
        payment_method=sale_data.payment_method,
        notes=sale_data.notes,
        subtotal=0,
        discount=sale_data.discount,
        tax=sale_data.tax,
        total_amount=0,
        status="Completed",
        created_by=user_id
    )

    db.add(sale)
    db.flush()

    subtotal_amount = 0

    for item in sale_data.items:
        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found."
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

        if item.unit_price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid price for {product.name}"
            )

        item_subtotal = item.quantity * item.unit_price
        subtotal_amount += item_subtotal

        item_total = (
            item_subtotal
            - item.discount
            + item.tax
        )

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            category_id=item.category_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            tax=item.tax,
            total=item_total
        )

        db.add(sale_item)
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == product.id,
                Inventory.company_id == company_id
            )
            .first()
        )

        if not inventory:
            inventory = Inventory(
                company_id=company_id,
                product_id=product.id,
                current_stock=product.stock_quantity,
                available_stock=product.stock_quantity
            )
            db.add(inventory)
            db.flush()

        previous_stock = inventory.current_stock

        inventory.current_stock -= item.quantity
        inventory.available_stock -= item.quantity

        movement = InventoryMovement(
            inventory_id=inventory.id,
            movement_type="Sale",
            quantity_changed=-item.quantity,
            previous_quantity=previous_stock,
            updated_quantity=inventory.current_stock,
            reason=f"Sale - {sale.invoice_number}",
            remarks=f"Sold to {customer.full_name}",
            performed_by=user_id
        )

        db.add(movement)

        product.stock_quantity -= item.quantity

        if 0 < product.stock_quantity <= 10: 
            create_notification(
                db=db,
                company_id=company_id,
                title="Low Stock Alert",
                message=(
                    f"{product.name} has only "
                    f"{product.stock_quantity} items remaining."
                )
            )

        create_audit_log(
            db=db,
            company_id=company_id,
            user_id=user_id,
            user_name=user_display_name,
            action="STOCK_ADJUSTMENT",
            resource_type="Product",
            resource_id=product.id,
            description=f"Stock reduced for {product.name} due to sale {sale.invoice_number}",
        )

        if product.stock_quantity == 0:
            product.status = "Out Of Stock"

            create_audit_log(
                db=db,
                company_id=company_id,
                user_id=user_id,
                user_name=user_display_name,
                action="UPDATE",
                resource_type="Product",
                resource_id=product.id,
                description=f"{product.name} marked Out Of Stock",
                before_values={"status": "Active"},
                after_values={"status": "Out Of Stock"},
            )

    grand_total = (
        subtotal_amount
        - sale_data.discount
        + sale_data.tax
    )

    if grand_total < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be greater than subtotal."
        )

    sale.subtotal = subtotal_amount
    sale.discount = sale_data.discount
    sale.tax = sale_data.tax
    sale.total_amount = grand_total

    db.commit()
    db.refresh(sale)

    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        user_name=user_display_name,
        action="CREATE",
        resource_type="Sale",
        resource_id=sale.id,
        description=f"Sale created - {sale.invoice_number}, total ₹{grand_total}",
    )

    return sale

def get_all_sales(
    db: Session,
    company_id: int,
    invoice_number: str = None,
    customer_name: str = None,
    payment_method: str = None,
    status: str = None,
    start_date: date = None,
    end_date: date = None,
    category_id: int = None,
    product_name: str = None,
    sort_by: str = None,
    sort_order: str = "desc",
):
    query = db.query(Sale).filter(
        Sale.company_id == company_id
    )

    if category_id:
        query = (
            query.join(SaleItem, Sale.id == SaleItem.sale_id)
            .filter(SaleItem.category_id == category_id)
        )

    if product_name:
        query = (
            query.join(SaleItem, Sale.id == SaleItem.sale_id)
            .join(Product, SaleItem.product_id == Product.id)
            .filter(Product.name.ilike(f"%{product_name}%"))
        )

    if invoice_number:
        query = query.filter(
            Sale.invoice_number.ilike(f"%{invoice_number}%")
        )

    if customer_name:
        query = query.filter(
            Sale.customer_name.ilike(f"%{customer_name}%")
        )

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )

    if status:
        query = query.filter(
            Sale.status == status
        )

    if start_date:
        query = query.filter(
            Sale.sale_date >= start_date
        )

    if end_date:
        query = query.filter(
            Sale.sale_date <= end_date
        )

    sort_columns = {
        "date": Sale.sale_date,
        "total_amount": Sale.total_amount,
        "customer_name": Sale.customer_name,
    }

    sort_column = sort_columns.get(sort_by, Sale.sale_date)

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    sales = query.all()

    if sales:
        sale_ids = [s.id for s in sales]

        counts = dict(
            db.query(SaleItem.sale_id, func.count(SaleItem.id))
            .filter(SaleItem.sale_id.in_(sale_ids))
            .group_by(SaleItem.sale_id)
            .all()
        )

        for sale in sales:
            sale.item_count = counts.get(sale.id, 0)

    return sales
def get_sale_by_id(
    db: Session,
    sale_id: int,
    company_id: int
):
    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found."
        )

    return sale

def update_sale(
    db: Session,
    sale_id: int,
    sale_data: SaleCreate,
    company_id: int
):
    
    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found."
        )

    
    old_items = (
        db.query(SaleItem)
        .filter(
            SaleItem.sale_id == sale.id
        )
        .all()
    )

    for old_item in old_items:

        product = (
            db.query(Product)
            .filter(
                Product.id == old_item.product_id,
                Product.company_id == company_id
            )
            .first()
        )

        if product:
            product.stock_quantity += old_item.quantity

            if product.stock_quantity > 0:
                product.status = "Active"

    
    db.query(SaleItem).filter(
        SaleItem.sale_id == sale.id
    ).delete()

    
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == sale_data.customer_id,
            Customer.company_id == company_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found."
        )

    
    subtotal_amount = 0

    for item in sale_data.items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found."
            )

        
        if item.unit_price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid price for {product.name}"
            )

       
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

        
        item_subtotal = (
            item.quantity * item.unit_price
        )

        subtotal_amount += item_subtotal

        
        item_total = (
            item_subtotal
            - item.discount
            + item.tax
        )

        
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            category_id=item.category_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            tax=item.tax,
            total=item_total
        )

        db.add(sale_item)

        
        product.stock_quantity -= item.quantity

        
        if 0 < product.stock_quantity <= 10:

            create_notification(
                db=db,
                company_id=company_id,
                title="Low Stock Alert",
                message=(
                    f"{product.name} has only "
                    f"{product.stock_quantity} items remaining."
                )
            )

        
        if product.stock_quantity == 0:

            product.status = "Out Of Stock"

    
    grand_total = (
        subtotal_amount
        - sale_data.discount
        + sale_data.tax
    )

    if grand_total < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be greater than subtotal."
        )

    
    sale.customer_id = customer.id
    sale.customer_name = customer.full_name
    sale.payment_method = sale_data.payment_method
    sale.notes = sale_data.notes

    sale.subtotal = subtotal_amount
    sale.discount = sale_data.discount
    sale.tax = sale_data.tax
    sale.total_amount = grand_total

    
    db.commit()
    db.refresh(sale)

    
    create_audit_log(
        db=db,
        company=str(company_id),
        user="Company Admin",
        action=f"Sale Updated - {sale.invoice_number}",
        ip="127.0.0.1",
        browser="Swagger"
    )

    return sale

def delete_sale(
    db: Session,
    sale_id: int,
    company_id: int
):
    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found."
        )

    sale_items = (
        db.query(SaleItem)
        .filter(SaleItem.sale_id == sale.id)
        .all()
    )

    for item in sale_items:

        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .first()
        )

        if product:
            product.stock_quantity += item.quantity

            if product.stock_quantity > 0:
                product.status = "Active"

    db.query(SaleItem).filter(
        SaleItem.sale_id == sale.id
    ).delete()

    db.delete(sale)

    create_audit_log(
    db=db,
    company=str(company_id),
    user="Company Admin",
    action=f"Sale Deleted - {sale.invoice_number}",
    ip="127.0.0.1",
    browser="Swagger"
)

    db.commit()

    return {
        "message": "Sale deleted successfully."
    }

def get_sales_dashboard(
    db: Session,
    company_id: int
):
    total_orders = (
        db.query(Sale)
        .filter(Sale.company_id == company_id)
        .count()
    )

    total_revenue = (
        db.query(func.sum(Sale.total_amount))
        .filter(Sale.company_id == company_id)
        .scalar()
    )

    if total_revenue is None:
        total_revenue = 0

    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )

    return {
        "total_sales": total_orders,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": average_order_value
    }



def get_sale_details(
    db: Session,
    sale_id: int,
    company_id: int
):
    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found."
        )

    items = (
        db.query(SaleItem)
        .filter(
            SaleItem.sale_id == sale.id
        )
        .all()
    )

    result = []

    for item in items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id
            )
            .first()
        )

        result.append({
            "product_name": product.name if product else "Unknown Product",
            "sku": product.sku if product else "-",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount": item.discount,
            "tax": item.tax,
            "total": item.total
        })
        salesperson = db.query(User).filter(User.id == sale.created_by).first()
        salesperson_name = salesperson.name if salesperson else "Unknown"

    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "customer_id": sale.customer_id,
        "customer_name": sale.customer_name,
        "sale_date": sale.sale_date,
        "payment_method": sale.payment_method,
        "salesperson_name": salesperson_name,
        "status": sale.status,
        "subtotal": sale.subtotal,
        "discount": sale.discount,
        "tax": sale.tax,
        "total_amount": sale.total_amount,
        "created_by": sale.created_by,
        "items": result
    }

def get_sales_summary(
    db: Session,
    company_id: int,
    start_date: date = None,
    end_date: date = None,
    product_id: int = None,
    category_id: int = None,
    customer_id: int = None,
    payment_method: str = None,
):
    sale_ids = _get_sale_ids_for_item_filters(db, company_id, product_id, category_id)

    if sale_ids is not None and len(sale_ids) == 0:
        return {
            "total_revenue": 0,
            "total_orders": 0,
            "average_order_value": 0,
            "total_items_sold": 0,
            "total_discount": 0,
            "total_tax": 0,
        }

    def base_query(q):
        if start_date:
            q = q.filter(Sale.sale_date >= start_date)
        if end_date:
            q = q.filter(Sale.sale_date <= end_date)
        if sale_ids is not None:
            q = q.filter(Sale.id.in_(sale_ids))
        if customer_id:
            q = q.filter(Sale.customer_id == customer_id)
        if payment_method:
            q = q.filter(Sale.payment_method == payment_method)
        return q

    total_orders = base_query(
        db.query(Sale).filter(Sale.company_id == company_id)
    ).count()

    total_revenue = base_query(
        db.query(func.sum(Sale.total_amount)).filter(Sale.company_id == company_id)
    ).scalar() or 0

    total_discount = base_query(
        db.query(func.sum(Sale.discount)).filter(Sale.company_id == company_id)
    ).scalar() or 0

    total_tax = base_query(
        db.query(func.sum(Sale.tax)).filter(Sale.company_id == company_id)
    ).scalar() or 0

    items_query = base_query(
        db.query(func.sum(SaleItem.quantity))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )
    total_items = items_query.scalar() or 0

    average_order_value = (
        total_revenue / total_orders if total_orders > 0 else 0
    )

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": average_order_value,
        "total_items_sold": total_items,
        "total_discount": total_discount,
        "total_tax": total_tax,
    }


def get_sales_trend(
    db: Session,
    company_id: int,
    period: str = "daily",
    start_date: date = None,
    end_date: date = None,
    product_id: int = None,
    category_id: int = None,
    customer_id: int = None,
    payment_method: str = None,
):
    if period == "monthly":
        bucket = func.date_trunc("month", Sale.sale_date)
    elif period == "weekly":
        bucket = func.date_trunc("week", Sale.sale_date)
    else:
        bucket = func.date_trunc("day", Sale.sale_date)

    sale_ids = _get_sale_ids_for_item_filters(db, company_id, product_id, category_id)

    if sale_ids is not None and len(sale_ids) == 0:
        return []

    query = (
        db.query(
            bucket.label("period"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("orders"),
        )
        .filter(Sale.company_id == company_id)
    )

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    if sale_ids is not None:
        query = query.filter(Sale.id.in_(sale_ids))
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)

    results = query.group_by(bucket).order_by(bucket.asc()).all()

    return [
        {
            "period": row.period.isoformat(),
            "revenue": float(row.revenue or 0),
            "orders": row.orders,
        }
        for row in results
    ]


def get_top_products(
    db: Session,
    company_id: int,
    sort_by: str = "revenue",
    start_date: date = None,
    end_date: date = None,
    category_id: int = None,
    customer_id: int = None,
    payment_method: str = None,
    limit: int = 10,
):
    query = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(SaleItem.quantity).label("units_sold"),
            func.sum(SaleItem.total).label("revenue"),
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    if category_id:
        query = query.filter(SaleItem.category_id == category_id)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)

    query = query.group_by(Product.id, Product.name)

    if sort_by == "quantity":
        query = query.order_by(func.sum(SaleItem.quantity).desc())
    else:
        query = query.order_by(func.sum(SaleItem.total).desc())

    results = query.limit(limit).all()

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "units_sold": row.units_sold,
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]


def get_top_customers(
    db: Session,
    company_id: int,
    start_date: date = None,
    end_date: date = None,
    product_id: int = None,
    category_id: int = None,
    payment_method: str = None,
    limit: int = 10,
):
    sale_ids = _get_sale_ids_for_item_filters(db, company_id, product_id, category_id)

    if sale_ids is not None and len(sale_ids) == 0:
        return []

    query = (
        db.query(
            Sale.customer_id.label("customer_id"),
            Sale.customer_name.label("customer_name"),
            func.count(Sale.id).label("order_count"),
            func.sum(Sale.total_amount).label("total_spend"),
        )
        .filter(Sale.company_id == company_id)
    )

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    if sale_ids is not None:
        query = query.filter(Sale.id.in_(sale_ids))
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)

    results = (
        query.group_by(Sale.customer_id, Sale.customer_name)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "order_count": row.order_count,
            "total_spend": float(row.total_spend or 0),
            "average_order_value": (
                float(row.total_spend) / row.order_count
                if row.order_count > 0
                else 0
            ),
        }
        for row in results
    ]


def get_payment_method_breakdown(
    db: Session,
    company_id: int,
    start_date: date = None,
    end_date: date = None,
    product_id: int = None,
    category_id: int = None,
    customer_id: int = None,
):
    sale_ids = _get_sale_ids_for_item_filters(db, company_id, product_id, category_id)

    if sale_ids is not None and len(sale_ids) == 0:
        return []

    query = (
        db.query(
            Sale.payment_method.label("payment_method"),
            func.count(Sale.id).label("transaction_count"),
            func.sum(Sale.total_amount).label("revenue"),
        )
        .filter(Sale.company_id == company_id)
    )

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    if sale_ids is not None:
        query = query.filter(Sale.id.in_(sale_ids))
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)

    results = (
        query.group_by(Sale.payment_method)
        .order_by(func.sum(Sale.total_amount).desc())
        .all()
    )

    return [
        {
            "payment_method": row.payment_method,
            "transaction_count": row.transaction_count,
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]


DEFAULT_LEAD_TIME_DAYS = 7


SAFETY_STOCK_PERCENT = 0.5 

DEMAND_LOOKBACK_DAYS = 30

TARGET_STOCK_BUFFER_DAYS = 14


def _calculate_average_daily_demand(db: Session, company_id: int, product_id: int):
   
    cutoff_date = datetime.utcnow() - timedelta(days=DEMAND_LOOKBACK_DAYS)

    total_sold = (
        db.query(func.sum(SaleItem.quantity))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
            Sale.sale_date >= cutoff_date,
        )
        .scalar()
    ) or 0

    average_daily_demand = total_sold / DEMAND_LOOKBACK_DAYS

    return average_daily_demand


def _calculate_forecast_for_product(db: Session, company_id: int, product: Product):
    
    avg_daily_demand = _calculate_average_daily_demand(db, company_id, product.id)

    forecasted_demand = avg_daily_demand * DEFAULT_LEAD_TIME_DAYS

    current_stock = product.stock_quantity or 0

    if avg_daily_demand > 0:
        days_of_stock_remaining = current_stock / avg_daily_demand
    else:
        days_of_stock_remaining = None 

    safety_stock = forecasted_demand * SAFETY_STOCK_PERCENT

    reorder_point = forecasted_demand + safety_stock

    target_stock_level = reorder_point + (avg_daily_demand * TARGET_STOCK_BUFFER_DAYS)

    if current_stock < reorder_point:
        recommended_quantity = max(0, round(target_stock_level - current_stock))
    else:
        recommended_quantity = 0

        # RISK CLASSIFICATION (based on the numbers above, not manual status)
    if avg_daily_demand == 0:
        risk = "No Sales Data"
        recommendation = "This product has no recent sales history - unable to forecast demand yet."
    elif current_stock <= 0:
        risk = "Out of Stock"
        recommendation = "Immediate reorder required - product is out of stock."
    elif current_stock < reorder_point:
        risk = "Low Stock"
        recommendation = "Stock has fallen below the reorder point. Reorder recommended."
    elif current_stock > target_stock_level * 1.5 and avg_daily_demand > 0:
        risk = "Overstock"
        recommendation = "Stock significantly exceeds forecasted needs. Consider reducing future orders."
    else:
        risk = "Healthy"
        recommendation = "Stock levels are sufficient for current demand."

    return {
        "product_id": product.id,
        "product_name": product.name,
        "sku": product.sku,
        "category_id": product.category_id,
        "current_stock": current_stock,
        "average_daily_sales": round(avg_daily_demand, 2),
        "forecasted_demand": round(forecasted_demand, 2),
        "days_of_stock_remaining": (
            round(days_of_stock_remaining, 1) if days_of_stock_remaining is not None else None
        ),
        "reorder_point": round(reorder_point, 2),
        "safety_stock": round(safety_stock, 2),
        "recommended_reorder_quantity": recommended_quantity,
        "stock_risk": risk,
        "recommendation": recommendation,
    }

def get_inventory_forecast(
    db: Session,
    company_id: int,
    risk: str = None,
    category_id: int = None,
    product_id: int = None,
    reorder_required: bool = None,
    sort_by: str = None,
    sort_order: str = "asc",
):
    query = db.query(Product).filter(Product.company_id == company_id)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if product_id:
        query = query.filter(Product.id == product_id)

    products = query.all()

    results = [
        _calculate_forecast_for_product(db, company_id, product)
        for product in products
    ]

    if risk:
        results = [r for r in results if r["stock_risk"] == risk]

    if reorder_required:
        results = [r for r in results if r["recommended_reorder_quantity"] > 0]

    sort_keys = {
        "current_stock": "current_stock",
        "forecasted_demand": "forecasted_demand",
        "days_remaining": "days_of_stock_remaining",
        "recommended_quantity": "recommended_reorder_quantity",
    }

    if sort_by in sort_keys:
        key = sort_keys[sort_by]
        results.sort(
            key=lambda r: (r[key] is None, r[key] if r[key] is not None else 0),
            reverse=(sort_order == "desc"),
        )
    elif sort_by == "risk":
        risk_order = {
            "Out of Stock": 0,
            "Stockout Risk": 1,
            "Low Stock": 2,
            "Healthy": 3,
            "Overstock": 4,
        }
        results.sort(
            key=lambda r: risk_order.get(r["stock_risk"], 99),
            reverse=(sort_order == "desc"),
        )

    return results


def get_product_recommendation(db: Session, company_id: int, product_id: int):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == company_id,
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    forecast = _calculate_forecast_for_product(db, company_id, product)

    recommended_stock_target = forecast["reorder_point"] + (
        forecast["average_daily_sales"] * TARGET_STOCK_BUFFER_DAYS
    )

    return {
        **forecast,
        "comparison": {
            "current_stock": forecast["current_stock"],
            "recommended_stock": round(recommended_stock_target, 2),
            "current_daily_demand": forecast["average_daily_sales"],
            "recommended_daily_demand": forecast["average_daily_sales"],
            "current_reorder_point": forecast["reorder_point"],
            "recommended_reorder_point": forecast["reorder_point"],
            "current_safety_stock": forecast["safety_stock"],
            "recommended_safety_stock": forecast["safety_stock"],
        },
    }
def get_product_demand_history(db: Session, company_id: int, product_id: int, days: int = 30):
    """
    Returns daily units sold for a product over the lookback window,
    used to plot Historical Demand vs Forecasted Demand on the chart.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    results = (
        db.query(
            func.date_trunc("day", Sale.sale_date).label("day"),
            func.sum(SaleItem.quantity).label("units_sold"),
        )
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
            Sale.sale_date >= cutoff_date,
        )
        .group_by(func.date_trunc("day", Sale.sale_date))
        .order_by(func.date_trunc("day", Sale.sale_date).asc())
        .all()
    )

    return [
        {"date": row.day.date().isoformat(), "units_sold": row.units_sold}
        for row in results
    ]