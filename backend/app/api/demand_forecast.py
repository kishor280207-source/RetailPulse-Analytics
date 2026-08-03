from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.demand_forecast import ForecastCreate
from app.services.demand_forecast_service import (
    generate_forecast,
    get_all_forecasts
)

router = APIRouter()


@router.post("/")
def create_forecast(
    data: ForecastCreate,
    db: Session = Depends(get_db)
):
    return generate_forecast(
        db=db,
        company_id=1,
        product_id=data.product_id,
        category_id=data.category_id,
        forecast_period=data.forecast_period
    )


@router.get("/")
def forecast_list(
    db: Session = Depends(get_db)
):
    return get_all_forecasts(db)