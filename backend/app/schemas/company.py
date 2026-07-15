from pydantic import BaseModel, EmailStr


class CompanyRegister(BaseModel):
    company_name: str
    industry: str
    company_email: EmailStr
    company_address: str
    company_phone: str

    owner_name: str
    owner_email: EmailStr

    password: str
    confirm_password: str
    