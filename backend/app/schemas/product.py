from pydantic import BaseModel
from typing import Optional
from app.schemas.stock import StockUpdate


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    brand: str
    description: Optional[str] = None
    unit_price: float
    cost_price: float
    stock_quantity: int
    unit_of_measure: str
    status: str = "Active"


class ProductUpdate(BaseModel):
    name: str
    sku: str
    category_id: int
    brand: str
    description: Optional[str] = None
    unit_price: float
    cost_price: float
    stock_quantity: int
    unit_of_measure: str
    status: str


class ProductResponse(BaseModel):
    id: int
    company_id: int
    category_id: int
    name: str
    sku: str
    brand: str
    description: Optional[str]
    unit_price: float
    cost_price: float
    stock_quantity: int
    unit_of_measure: str
    status: str

    class Config:
        from_attributes = True