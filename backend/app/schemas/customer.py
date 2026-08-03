from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional


class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    customer_type: str
    preferred_sales_channel: Optional[str] = None
    status: Optional[str] = "Active"


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    customer_type: Optional[str] = None
    preferred_sales_channel: Optional[str] = None
    status: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    customer_id: str
    full_name: str
    email: str
    phone: str
    gender: Optional[str]
    date_of_birth: Optional[date]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    customer_type: Optional[str]
    preferred_sales_channel: Optional[str]
    status: str

    class Config:
        from_attributes = True