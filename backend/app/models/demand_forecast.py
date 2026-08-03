from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class DemandForecast(Base):

    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id")
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id")
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id")
    )

    forecast_period = Column(String)

    predicted_demand = Column(Float)

    confidence_score = Column(Float)

    generated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    company = relationship("Company")

    product = relationship("Product")

    category = relationship("Category")