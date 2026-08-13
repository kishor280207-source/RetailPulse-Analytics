from app.repositories.sales_repository import (
    create_sale,
    get_all_sales,
    get_sale_by_id,
    update_sale,
    delete_sale,
    get_sales_dashboard,
    get_sale_details,
    get_sales_summary,
    get_sales_trend,
    get_top_products,
    get_top_customers,
    get_payment_method_breakdown
)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database.database import get_db
from app.schemas.sales import SaleCreate, SaleResponse
from app.dependencies.auth import get_current_user

from app.repositories.sales_repository import (
    create_sale,
    get_all_sales,
    get_sale_by_id,
    update_sale,
    delete_sale,
    get_sales_dashboard,
    get_sale_details,
)

router = APIRouter()



@router.post("/", response_model=SaleResponse)
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


@router.get("/", response_model=list[SaleResponse])
def get_sales(
    invoice_number: Optional[str] = None,
    customer_name: Optional[str] = None,
    payment_method: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    product_name: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_all_sales(
        db=db,
        company_id=current_user["company_id"],
        invoice_number=invoice_number,
        customer_name=customer_name,
        payment_method=payment_method,
        status=status,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        product_name=product_name,
        sort_by=sort_by,
        sort_order=sort_order,
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



@router.get("/{sale_id}", response_model=SaleResponse)
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

@router.put("/{sale_id}", response_model=SaleResponse)
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
    )@router.get("/analytics/summary")
def sales_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_sales_summary(
        db=db,
        company_id=current_user["company_id"],
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
    )


@router.get("/analytics/trend")
def sales_analytics_trend(
    period: str = "daily",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_sales_trend(
        db=db,
        company_id=current_user["company_id"],
        period=period,
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
    )


@router.get("/analytics/products")
def sales_analytics_products(
    sort_by: str = "revenue",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_top_products(
        db=db,
        company_id=current_user["company_id"],
        sort_by=sort_by,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
        limit=limit,
    )


@router.get("/analytics/customers")
def sales_analytics_customers(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_top_customers(
        db=db,
        company_id=current_user["company_id"],
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        payment_method=payment_method,
        limit=limit,
    )


@router.get("/analytics/payment-methods")
def sales_analytics_payment_methods(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_payment_method_breakdown(
        db=db,
        company_id=current_user["company_id"],
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
    )