from app.models.customer_purchase_summary import CustomerPurchaseSummary
from sqlalchemy.orm import Session
from uuid import uuid4
from sqlalchemy import or_
from sqlalchemy import func
from datetime import datetime
from app.models.sales import Sale

from app.models.customer import Customer


def create_customer(db: Session, data, company_id: int):

    customer = Customer(
        company_id=company_id,
        customer_id=f"CUST-{uuid4().hex[:8].upper()}",
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        address=data.address,
        city=data.city,
        state=data.state,
        country=data.country,
        customer_type=data.customer_type,
        preferred_sales_channel=data.preferred_sales_channel,
        status=data.status
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer
def get_all_customers(db: Session):

    return (
        db.query(Customer)
        .order_by(Customer.id.desc())
        .all()
    )

def get_customer_by_id(db: Session, customer_id: int):

    return (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )


def update_customer(db: Session, customer_id: int, data):

    customer = get_customer_by_id(db, customer_id)

    if not customer:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer


def delete_customer(db: Session, customer_id: int):

    customer = get_customer_by_id(db, customer_id)

    if not customer:
        return None

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer deleted successfully"
    }
def get_customer_profile(db: Session, customer_id: int):

    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        return None

    summary = (
        db.query(CustomerPurchaseSummary)
        .filter(
            CustomerPurchaseSummary.customer_id == customer.id
        )
        .first()
    )

    return {
        "customer": customer,
        "summary": summary
    }

def search_customers(
    db: Session,
    search: str = None,
    customer_type: str = None,
    status: str = None
):

    query = db.query(Customer)

    if search:
        query = query.filter(
            or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.customer_id.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%")
            )
        )

    if customer_type:
        query = query.filter(
            Customer.customer_type == customer_type
        )

    if status:
        query = query.filter(
            Customer.status == status
        )

    return query.order_by(Customer.id.desc()).all()

def get_customer_analytics(db: Session):

    total_customers = db.query(Customer).count()

    active_customers = (
        db.query(Customer)
        .filter(Customer.status == "Active")
        .count()
    )

    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year

    new_customers = (
        db.query(Customer)
        .filter(
            func.extract("month", Customer.created_at) == current_month,
            func.extract("year", Customer.created_at) == current_year
        )
        .count()
    )

    summaries = db.query(CustomerPurchaseSummary).all()

    total_revenue = sum(
        s.total_revenue or 0
        for s in summaries
    )

    average_spend = (
        total_revenue / total_customers
        if total_customers else 0
    )

    purchase_frequency = (
        sum(s.purchase_frequency or 0 for s in summaries)
        / len(summaries)
        if summaries else 0
    )

    returning_customers = len(
        [
            s for s in summaries
            if (s.total_orders or 0) > 1
        ]
    )

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "new_customers": new_customers,
        "returning_customers": returning_customers,
        "average_customer_spend": average_spend,
        "total_customer_revenue": total_revenue,
        "purchase_frequency": purchase_frequency
    }

def get_customer_purchase_history(db: Session, customer_id: int):

    purchases = (
        db.query(Sale)
        .filter(Sale.customer_id == customer_id)
        .order_by(Sale.id.desc())
        .all()
    )

    return purchases

def get_customer_segments(db: Session):

    summaries = db.query(CustomerPurchaseSummary).all()

    result = []

    for summary in summaries:

        if summary.total_orders <= 1:
            segment = "New Customer"

        elif summary.total_orders <= 5:
            segment = "Regular Customer"

        elif summary.total_orders <= 10:
            segment = "Loyal Customer"

        else:
            segment = "VIP Customer"

        customer = (
            db.query(Customer)
            .filter(Customer.id == summary.customer_id)
            .first()
        )

        if customer:
            result.append({
                "customer_id": customer.customer_id,
                "name": customer.full_name,
                "segment": segment,
                "total_orders": summary.total_orders,
                "total_revenue": summary.total_revenue
            })

    return result