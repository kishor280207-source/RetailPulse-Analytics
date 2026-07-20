from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.sales import SaleCreate
from app.schemas.sales import SaleResponse

from app.repositories.sales_repository import create_sale
from app.dependencies.auth import get_current_user
from app.repositories.sales_repository import (
    create_sale,
    get_all_sales,
    get_sale_by_id,
    update_sale,
    delete_sale,
    get_sales_dashboard
)
from typing import Optional
from datetime import date
from typing import Optional
from app.repositories.sales_repository import get_sale_details

router = APIRouter()


@router.post(
    "/",
    response_model=SaleResponse
)
def create_new_sale(
    sale: SaleCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    return create_sale(
        db=db,
        sale_data=sale,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"]

    )
@router.get(
    "/",
    response_model=list[SaleResponse]
)
def get_sales(
    invoice_number: Optional[str] = None,
    customer_name: Optional[str] = None,
    sales_channel: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: int = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    product_name: str = None
):

    return get_all_sales(
        db=db,
        company_id=current_user["company_id"],
        invoice_number=invoice_number,
        customer_name=customer_name,
        sales_channel=sales_channel,
        payment_method=payment_method,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        product_name=product_name,
        
    )
@router.get(
    "/{sale_id}",
    response_model=SaleResponse
)
def get_sale(
    sale_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_sale_by_id(
        db=db,
        sale_id=sale_id,
        company_id=current_user["company_id"]
    )

@router.put(
    "/{sale_id}",
    response_model=SaleResponse
)
def edit_sale(
    sale_id: int,
    sale: SaleCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return update_sale(
        db=db,
        sale_id=sale_id,
        sale_data=sale,
        company_id=current_user["company_id"]
    )

@router.delete("/{sale_id}")
def remove_sale(
    sale_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return delete_sale(
        db=db,
        sale_id=sale_id,
        company_id=current_user["company_id"]
    )
@router.get("/", response_model=list[SaleResponse])
def get_sales(
    invoice_number: Optional[str] = None,
    customer_name: Optional[str] = None,
    sales_channel: Optional[str] = None,
    payment_method: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_all_sales(
        db=db,
        company_id=current_user["company_id"],
        invoice_number=invoice_number,
        customer_name=customer_name,
        sales_channel=sales_channel,
        payment_method=payment_method
    )

@router.get("/dashboard/summary")
def dashboard_summary(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_sales_dashboard(
        db=db,
        company_id=current_user["company_id"]
    )
    return query.order_by(
        Sale.sale_date.desc()
).all()
@router.get("/{sale_id}/details")
def sale_details(
    sale_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_sale_details(
        db=db,
        sale_id=sale_id,
        company_id=current_user["company_id"]
    )