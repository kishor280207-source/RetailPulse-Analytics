from pydantic import BaseModel
from typing import Optional


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "Active"


class CategoryUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str


class CategoryResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: Optional[str]
    status: str
class CategoryCreate(BaseModel):
    name: str
    company_id: int


class CategoryResponse(BaseModel):
    id: int
    name: str
    company_id: int    

    class Config:
        from_attributes = True