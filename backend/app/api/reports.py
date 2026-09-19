from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin

from app.services.report_service import generate_report
from app.repositories.report_repository import (
    get_report_history,
    create_schedule,
    get_schedules,
    update_schedule,
    delete_schedule,
    run_schedule_now,
)

router = APIRouter()


@router.get("/generate")
def generate(
    report_type: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    brand: Optional[str] = None,
    stock_status: Optional[str] = None,
    export_format: str = "View",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "product_id": product_id,
        "category_id": category_id,
        "customer_id": customer_id,
        "status": status,
        "brand": brand,
        "stock_status": stock_status,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    return generate_report(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        user_name=current_user.get("sub", "Unknown"),
        report_type=report_type,
        filters=filters,
        export_format=export_format,
    )


@router.get("/history")
def report_history(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_report_history(db=db, company_id=current_user["company_id"], page=page, limit=limit)


@router.get("/schedules")
def list_schedules(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return get_schedules(db=db, company_id=current_user["company_id"])


@router.post("/schedules")
def new_schedule(
    data: dict,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return create_schedule(db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], data=data)


@router.put("/schedules/{schedule_id}")
def edit_schedule(
    schedule_id: int,
    data: dict,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return update_schedule(db=db, company_id=current_user["company_id"], schedule_id=schedule_id, data=data)


@router.delete("/schedules/{schedule_id}")
def remove_schedule(
    schedule_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return delete_schedule(db=db, company_id=current_user["company_id"], schedule_id=schedule_id)


@router.post("/schedules/{schedule_id}/run")
def trigger_schedule(
    schedule_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return run_schedule_now(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        user_name=current_user.get("sub", "Unknown"),
        schedule_id=schedule_id,
    )