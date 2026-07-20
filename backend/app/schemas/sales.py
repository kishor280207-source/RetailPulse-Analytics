from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    category_id: int
    quantity: int
    unit_price: float
    discount: float = 0
    tax: float = 0


class SaleCreate(BaseModel):
    customer_name: str
    sales_channel: str
    payment_method: str
    items: list[SaleItemCreate]


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    category_id: int
    quantity: int
    unit_price: float
    discount: float
    tax: float
    total: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    sale_date: datetime
    sales_channel: str
    payment_method: str
    total_amount: float
    created_by: int

    class Config:
        from_attributes = True