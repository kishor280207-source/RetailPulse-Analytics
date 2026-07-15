from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User

from app.utils.security import hash_password


def create_company(db: Session, data):

    company = Company(
        name=data.company_name,
        industry=data.industry,
        email=data.company_email,
        address=data.company_address,
        phone=data.company_phone
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    admin = User(
        company_id=company.id,
        name=data.owner_name,
        email=data.owner_email,
        password=hash_password(data.password),
        role="Company Admin",
        status="Active"
    )

    db.add(admin)
    db.commit()

    return company