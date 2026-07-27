from pydantic import BaseModel


class InventoryCreate(BaseModel):
    product_id: int
    current_stock: int
    reserved_stock: int = 0
    reorder_level: int


class InventoryUpdate(BaseModel):
    current_stock: int
    reserved_stock: int
    reorder_level: int


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    current_stock: int
    reserved_stock: int
    available_stock: int
    reorder_level: int
    stock_status: str

class Config:
        from_attributes = True
class StockAdjustment(BaseModel):
    quantity: int
    reason: str
    remarks: str = ""        