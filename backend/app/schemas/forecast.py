from pydantic import BaseModel


class ForecastResponse(BaseModel):

    product_id: int
    category_id: int

    forecast_period: str

    predicted_demand: float

    confidence_score: float

    class Config:
        from_attributes = True