from datetime import datetime
from sqlalchemy.orm import Session

from app.models.sales import Sale


def generate_invoice_number(db: Session, company_id: int) -> str:
    """
    Generate invoice number in the format:
    INV-2026-000001
    """

    year = datetime.now().year

    last_sale = (
        db.query(Sale)
        .filter(Sale.company_id == company_id)
        .order_by(Sale.id.desc())
        .first()
    )

    if last_sale:
        last_number = int(last_sale.invoice_number.split("-")[-1])
        next_number = last_number + 1
    else:
        next_number = 1

    invoice = f"INV-{year}-{next_number:06d}"

    return invoice