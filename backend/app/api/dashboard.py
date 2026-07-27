from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.dashboard_service import (get_dashboard_summary, get_revenue_trend,  get_top_products, get_recent_sales,  get_inventory_category)

router = APIRouter()


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db)
):

    return get_dashboard_summary(db)
@router.get("/revenue-trend")
def revenue_trend(
    db: Session = Depends(get_db)
):
    return get_revenue_trend(db)
@router.get("/top-products")
def top_products(
    db: Session = Depends(get_db)
):
    return get_top_products(db)
@router.get("/recent-sales")
def recent_sales(
    db: Session = Depends(get_db)
):
    return get_recent_sales(db)
@router.get("/inventory-category")
def inventory_category(
    db: Session = Depends(get_db)
):
    return get_inventory_category(db)