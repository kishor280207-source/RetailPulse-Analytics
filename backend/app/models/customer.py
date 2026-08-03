from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    customer_id = Column(String, unique=True, nullable=False)

    full_name = Column(String, nullable=False)

    email = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    gender = Column(String)

    date_of_birth = Column(Date)

    address = Column(String)

    city = Column(String)

    state = Column(String)

    country = Column(String)

    customer_type = Column(String)

    preferred_sales_channel = Column(String)

    status = Column(String, default="Active")

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )