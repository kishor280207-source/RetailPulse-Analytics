from pydantic import BaseModel, Field

class CompanyRegister(BaseModel):
    company_name: str
    industry: str
    company_email: str
    company_address: str
    company_phone: str

    owner_name: str
    owner_email: str

    password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)