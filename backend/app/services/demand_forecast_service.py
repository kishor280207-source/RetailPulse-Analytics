from sqlalchemy.orm import Session
from app.models.demand_forecast import DemandForecast
from app.models.sale_item import SaleItem
from app.models.product import Product


def generate_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    category_id: int,
    forecast_period: str
):

    sales = (
        db.query(SaleItem)
        .filter(SaleItem.product_id == product_id)
        .all()
    )

    total_sales = sum(item.quantity for item in sales)

    if len(sales) == 0:
        predicted = 0
    else:
        predicted = total_sales / len(sales)

    forecast = DemandForecast(
        company_id=company_id,
        product_id=product_id,
        category_id=category_id,
        forecast_period=forecast_period,
        predicted_demand=predicted,
        confidence_score=85
    )

    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    return forecast


def get_all_forecasts(db: Session):
    return (
        db.query(DemandForecast)
        .order_by(DemandForecast.id.desc())
        .all()
    )