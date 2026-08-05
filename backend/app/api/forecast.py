from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.forecast_service import (
    generate_forecast,
    get_forecasts,
    get_inventory_recommendations
)
from fastapi.responses import StreamingResponse
import io
import csv
from fastapi import Query

router = APIRouter()


@router.post("/generate")
def generate(
    days: int = Query(default=30),
    db: Session = Depends(get_db)
):
    return generate_forecast(db, days)

@router.get("/")
def forecasts(
    company_id: int = 1,
    db: Session = Depends(get_db)
):
    return get_forecasts(
        db,
        company_id
    )

@router.get("/recommendations")
def recommendations(db: Session = Depends(get_db)):
    return get_inventory_recommendations(db)

@router.get("/export/csv")
def export_forecast_csv(db: Session = Depends(get_db)):

    forecasts = get_forecasts(db)

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Product",
        "Category",
        "Period",
        "Predicted Demand",
        "Confidence"
    ])

    for item in forecasts:
        writer.writerow([
            item.product_id,
            item.category_id,
            item.forecast_period,
            item.predicted_demand,
            item.confidence_score
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=forecast.csv"
        }
    )