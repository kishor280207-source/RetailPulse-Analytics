from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"))

    product_id = Column(Integer, ForeignKey("products.id"))

    category_id = Column(Integer, ForeignKey("categories.id"))

    forecast_period = Column(String(50))

    predicted_demand = Column(Float)

    confidence_score = Column(Float)

    generated_at = Column(
        DateTime,
        server_default=func.now()
    )