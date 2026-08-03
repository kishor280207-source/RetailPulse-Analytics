from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.dashboard_service import (get_dashboard_summary, get_revenue_trend,  get_top_products, get_recent_sales,  get_inventory_category, get_top_categories,get_payment_method_sales,get_sales_channel,get_stock_status_summary,get_inventory_value_category)
from fastapi import Query
router = APIRouter()


@router.get("/summary")
def dashboard_summary(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    payment_method: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db)
):

    return get_dashboard_summary(db, start_date,
        end_date,
        payment_method,
        category)
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
@router.get("/top-categories")
def top_categories(
    db: Session = Depends(get_db)
):
    return get_top_categories(db)
@router.get("/payment-method")
def payment_method(
    db: Session = Depends(get_db)
):
    return get_payment_method_sales(db)
@router.get("/sales-channel")
def sales_channel(
    db: Session = Depends(get_db)
):
    return get_sales_channel(db)
@router.get("/stock-status")
def stock_status(
    db: Session = Depends(get_db)
):
    return get_stock_status_summary(db)
@router.get("/inventory-value")
def inventory_value(
    db: Session = Depends(get_db)
):
    return get_inventory_value_category(db)