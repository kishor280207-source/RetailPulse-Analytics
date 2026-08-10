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
from app.models.customer import Customer

def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int
):
    
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

       
        item_subtotal = (
            item.quantity * item.unit_price
        )

        
        if item.unit_price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid price for {product.name}"
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