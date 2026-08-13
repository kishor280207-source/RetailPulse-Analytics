from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    category_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)
    discount: float = Field(default=0, ge=0)
    tax: float = Field(default=0, ge=0)


class SaleCreate(BaseModel):
    customer_id: int
    payment_method: str
    notes: Optional[str] = None
    discount: float = Field(default=0, ge=0)
    tax: float = Field(default=0, ge=0)
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
    customer_id: int
    customer_name: str
    sale_date: datetime
    payment_method: str
    notes: Optional[str]
    subtotal: float
    discount: float
    tax: float
    total_amount: float
    status: str
    created_by: int
    item_count: Optional[int] = None

    class Config:
        from_attributes = True