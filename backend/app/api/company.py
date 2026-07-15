from fastapi import APIRouter
from fastapi import Depends
from fastapi import Request
from app.services.audit_service import create_audit_log
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.company import CompanyRegister

from app.services.company_service import create_company

router = APIRouter()


@router.post("/register")
def register_company(
    request: Request,
    company: CompanyRegister,
    db: Session = Depends(get_db)
):

    if company.password != company.confirm_password:
        return {"message": "Password does not match"}

    create_company(db, company)

    return {"message": "Company Registered Successfully"}