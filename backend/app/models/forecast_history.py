from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class ForecastHistory(Base):

    __tablename__ = "forecast_history"

    id = Column(Integer, primary_key=True, index=True)

    forecast_id = Column(
        Integer,
        ForeignKey("demand_forecasts.id")
    )

    historical_sales = Column(Float)

    prediction = Column(Float)

    accuracy = Column(Float)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    forecast = relationship("DemandForecast")