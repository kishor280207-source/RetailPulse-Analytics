from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.database.database import get_db
from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.sales import SaleCreate
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


@router.post("/")
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user_id = current_user["id"]
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == data.customer_id,
            Customer.company_id == company_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )


    if not data.items:
        raise HTTPException(
            status_code=400,
            detail="At least one product is required"
        )

    subtotal = 0
    sale_items = []

    for item in data.items:

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
                detail=f"Product {item.product_id} not found"
            )

        
        if item.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for {product.name}. "
                    f"Available stock: {product.stock_quantity}"
                )
            )

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero"
            )

        if item.unit_price <= 0:
            raise HTTPException(
                status_code=400,
                detail="Unit price must be greater than zero"
            )

        
        line_subtotal = item.quantity * item.unit_price

        line_discount = item.discount or 0
        line_tax = item.tax or 0

        line_total = (
            line_subtotal
            - line_discount
            + line_tax
        )

        subtotal += line_subtotal

        sale_item = SaleItem(
            product_id=product.id,
            category_id=product.category_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=line_discount,
            tax=line_tax,
            total=line_total
        )

        sale_items.append(
            (sale_item, product)
        )

    
    discount = data.discount or 0
    tax = data.tax or 0

    total_amount = (
        subtotal
        - discount
        + tax
    )

    if total_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Final amount cannot be negative"
        )

    
    last_sale = (
        db.query(Sale)
        .order_by(Sale.id.desc())
        .first()
    )

    if last_sale and last_sale.id:
        next_number = last_sale.id + 1
    else:
        next_number = 1

    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{next_number:05d}"

   
    existing_invoice = (
        db.query(Sale)
        .filter(Sale.invoice_number == invoice_number)
        .first()
    )

    if existing_invoice:
        raise HTTPException(
            status_code=400,
            detail="Duplicate invoice number"
        )

   
    sale = Sale(
        company_id=company_id,
        invoice_number=invoice_number,
        customer_id=customer.id,
        customer_name=customer.name,
        payment_method=data.payment_method,
        notes=data.notes,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total_amount=total_amount,
        status="Completed",
        created_by=user_id
    )

    db.add(sale)
    db.flush()

    
    for sale_item, product in sale_items:

        sale_item.sale_id = sale.id

        db.add(sale_item)

        product.stock_quantity -= sale_item.quantity

        db.add(product)

   
    db.commit()

    db.refresh(sale)

   
    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "customer_id": sale.customer_id,
        "customer_name": sale.customer_name,
        "sale_date": sale.sale_date,
        "payment_method": sale.payment_method,
        "notes": sale.notes,
        "subtotal": sale.subtotal,
        "discount": sale.discount,
        "tax": sale.tax,
        "total_amount": sale.total_amount,
        "status": sale.status,
        "created_by": sale.created_by
    }