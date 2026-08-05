from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import Query

from app.database.database import get_db
from app.schemas.customer import CustomerCreate
from app.services.customer_service import (
    create_customer,
    get_all_customers,
    get_customer_by_id,
    update_customer,
    delete_customer,
    get_customer_profile,
    search_customers,
    get_customer_analytics,
    get_customer_purchase_history,
    get_customer_segments
)

from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate
)
from fastapi.responses import StreamingResponse
import io
import csv

router = APIRouter()


@router.post("/")
def add_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db)
):
    # Replace company_id with logged-in user's company later
    return create_customer(db, data, company_id=1)


@router.get("/")
def customers(
    db: Session = Depends(get_db)
):
    return get_all_customers(db)



@router.get("/profile/{customer_id}")
def customer_profile(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return get_customer_profile(
        db,
        customer_id
    )

@router.get("/search/")
def search_customer(
    search: str | None = Query(default=None),
    customer_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db)
):

    return search_customers(
        db,
        search,
        customer_type,
        status
    )

@router.get("/analytics/dashboard")
def analytics(
    db: Session = Depends(get_db)
):
    return get_customer_analytics(db)

@router.get("/purchase-history/{customer_id}")
def purchase_history(
    customer_id: int,
    db: Session = Depends(get_db)
):

    return get_customer_purchase_history(
        db,
        customer_id
    )
@router.get("/segments")
def customer_segments(
    db: Session = Depends(get_db)
):
    return get_customer_segments(db)

@router.get("/{customer_id}")
def customer_details(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return get_customer_by_id(db, customer_id)
@router.put("/{customer_id}")
def edit_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    return update_customer(
        db,
        customer_id,
        data
    )
@router.delete("/{customer_id}")
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return delete_customer(
        db,
        customer_id
    )
@router.get("/export/csv")
def export_customers_csv(
    db: Session = Depends(get_db)
):

    customers = get_all_customers(db)

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Name",
        "Email",
        "Phone",
        "Type",
        "Status"
    ])

    for customer in customers:

        writer.writerow([
            customer.customer_id,
            customer.full_name,
            customer.email,
            customer.phone,
            customer.customer_type,
            customer.status
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=customers.csv"
        }
    )