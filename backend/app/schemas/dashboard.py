from pydantic import BaseModel
from typing import Optional


class DashboardFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    category: Optional[int] = None
    brand: Optional[str] = None
    payment_method: Optional[str] = None
    sales_channel: Optional[str] = None