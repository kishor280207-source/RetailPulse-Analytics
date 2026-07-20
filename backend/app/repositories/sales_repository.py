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
from app.models.sale_item import SaleItem
from app.models.product import Product
def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int
):

    invoice_number = generate_invoice_number(
        db,
        company_id
    )

    grand_total = 0

    sale = Sale(
        company_id=company_id,
        invoice_number=invoice_number,
        customer_name=sale_data.customer_name,
        sales_channel=sale_data.sales_channel,
        payment_method=sale_data.payment_method,
        total_amount=0,
        created_by=user_id
    )

    db.add(sale)
    db.flush()

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
                detail="Product not found."
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

        subtotal = item.quantity * item.unit_price

        total = subtotal - item.discount + item.tax

        grand_total += total

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            category_id=item.category_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            tax=item.tax,
            total=total
        )

        db.add(sale_item)

        product.stock_quantity -= item.quantity

        if product.stock_quantity <= 10 and product.stock_quantity > 0:

         create_notification(
           db=db,
           company_id=company_id,
           title="Low Stock Alert",
           message=f"{product.name} has only {product.stock_quantity} items remaining."
    )

        create_audit_log(
    db=db,
    company=str(company_id),
    user=str(user_id),
    action=f"Inventory Updated - {product.name}",
    ip="127.0.0.1",
    browser="Swagger"
)

        if product.stock_quantity == 0:
            product.status = "Out Of Stock"

            create_audit_log(
        db=db,
        company=str(company_id),
        user=str(user_id),
        action=f"Product Out Of Stock - {product.name}",
        ip="127.0.0.1",
        browser="Swagger"
    )

    sale.total_amount = grand_total

    db.commit()

    db.refresh(sale)

    create_audit_log(
    db=db,
    company=str(company_id),
    user=str(user_id),
    action=f"Sale Created - {sale.invoice_number}",
    ip="127.0.0.1",
    browser="Swagger"
)

    return sale


def get_all_sales(
    db: Session,
    company_id: int,
    invoice_number: str = None,
    customer_name: str = None,
    sales_channel: str = None,
    payment_method: str = None,
    start_date: date = None,
    end_date: date = None,
    category_id: int = None,
    product_name: str = None,
):
    query = db.query(Sale).filter(
        Sale.company_id == company_id
    )

    if category_id:

      query = (
        query.join(
            SaleItem,
            Sale.id == SaleItem.sale_id
        )
        .filter(
            SaleItem.category_id == category_id
        )
    )
      
    if product_name:

       query = (
        query.join(
            SaleItem,
            Sale.id == SaleItem.sale_id
        )
        .join(
            Product,
            SaleItem.product_id == Product.id
        )
        .filter(
            Product.name.ilike(f"%{product_name}%")
        )
    )  

    if invoice_number:
        query = query.filter(
            Sale.invoice_number.ilike(f"%{invoice_number}%")
        )

    if customer_name:
        query = query.filter(
            Sale.customer_name.ilike(f"%{customer_name}%")
        )

    if sales_channel:
        query = query.filter(
            Sale.sales_channel == sales_channel
        )

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )
    if start_date:
        query = query.filter(
        Sale.sale_date >= start_date
    )

    if product_name:

        query = (
          query.join(
            SaleItem,
            Sale.id == SaleItem.sale_id
        )
        .join(
            Product,
            SaleItem.product_id == Product.id
        )
        .filter(
            Product.name.ilike(f"%{product_name}%")
        )
    )    

    if end_date:
        query = query.filter(
        Sale.sale_date <= end_date
    )    

    return query.order_by(
        Sale.sale_date.desc()
    ).all()

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

    # Restore previous stock
    old_items = (
        db.query(SaleItem)
        .filter(SaleItem.sale_id == sale.id)
        .all()
    )

    for old_item in old_items:
        product = db.query(Product).filter(
            Product.id == old_item.product_id
        ).first()

        if product:
            product.stock_quantity += old_item.quantity

    # Delete old sale items
    db.query(SaleItem).filter(
        SaleItem.sale_id == sale.id
    ).delete()

    grand_total = 0

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
                detail="Product not found."
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

        subtotal = item.quantity * item.unit_price
        total = subtotal - item.discount + item.tax

        grand_total += total

        db.add(
            SaleItem(
                sale_id=sale.id,
                product_id=item.product_id,
                category_id=item.category_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount=item.discount,
                tax=item.tax,
                total=total
            )
        )

        product.stock_quantity -= item.quantity

    sale.customer_name = sale_data.customer_name
    sale.sales_channel = sale_data.sales_channel
    sale.payment_method = sale_data.payment_method
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
            detail="Sale not found"
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

            "product_name": product.name,

            "quantity": item.quantity,

            "unit_price": item.unit_price,

            "discount": item.discount,

            "tax": item.tax,

            "total": item.total

        })

    return {

        "invoice_number": sale.invoice_number,

        "customer_name": sale.customer_name,

        "sale_date": sale.sale_date,

        "sales_channel": sale.sales_channel,

        "payment_method": sale.payment_method,

        "total_amount": sale.total_amount,

        "items": result

    }