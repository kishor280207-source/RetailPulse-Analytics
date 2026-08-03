from pydantic import BaseModel
from datetime import datetime


class ForecastCreate(BaseModel):
    product_id: int
    category_id: int
    forecast_period: str


class ForecastResponse(BaseModel):
    id: int
    company_id: int
    product_id: int
    category_id: int
    forecast_period: str
    predicted_demand: float
    confidence_score: float
    generated_at: datetime

    class Config:
        from_attributes = True