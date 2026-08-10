from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    invoice_number = Column(
        String,
        nullable=False,
        unique=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    customer_name = Column(
        String,
        nullable=False
    )

    sale_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


    payment_method = Column(
        String,
        nullable=False
    )

    notes = Column(
    String,
    nullable=True
    )

    subtotal = Column(
        Float,
        nullable=False
    )

    discount = Column(
        Float,
        default=0
    )

    tax = Column(
        Float,
        default=0
    )

    total_amount = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        default="Completed"
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )