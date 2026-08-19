from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.dependencies.auth import get_current_user

from app.repositories.sales_repository import (
    get_inventory_forecast,
    get_product_recommendation,
    get_product_demand_history
)

router = APIRouter()


@router.get("/forecast")
def forecast(
    risk: Optional[str] = None,
    category_id: Optional[int] = None,
    product_id: Optional[int] = None,
    reorder_required: Optional[bool] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_inventory_forecast(
        db=db,
        company_id=current_user["company_id"],
        risk=risk,
        category_id=category_id,
        product_id=product_id,
        reorder_required=reorder_required,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/recommendations/{product_id}")
def recommendation(
    product_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_product_recommendation(
        db=db,
        company_id=current_user["company_id"],
        product_id=product_id,
    )

@router.get("/demand-history/{product_id}")
def demand_history(
    product_id: int,
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_product_demand_history(
        db=db,
        company_id=current_user["company_id"],
        product_id=product_id,
        days=days,
    )