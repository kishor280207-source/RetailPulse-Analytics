import pandas as pd
import io
import json
from datetime import datetime
from sqlalchemy.orm import Session
import uuid
from app.models.product import Product
from app.models.customer import Customer
from app.models.category import Category
from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.models.import_history import ImportHistory
from app.models.import_error import ImportError as ImportErrorModel
from app.repositories.sales_repository import generate_invoice_number
import re
from datetime import datetime as dt

REQUIRED_COLUMNS = {
    "Products": ["Product Name", "SKU", "Category", "Unit Price", "Stock Quantity"],
    "Customers": ["Name", "Email", "Phone"],
    "Sales": ["Customer", "Product", "Quantity", "Unit Price", "Sale Date"],
}


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        df = df.fillna("")
        return df
    except Exception:
        raise ValueError("Could not parse the file. Please ensure it's a valid CSV.")


def get_preview(df: pd.DataFrame, import_type: str, max_rows: int = 10):
    required = REQUIRED_COLUMNS.get(import_type, [])
    missing_columns = [col for col in required if col not in df.columns]

    return {
        "columns": list(df.columns),
        "missing_columns": missing_columns,
        "total_records": len(df),
        "preview_rows": df.head(max_rows).to_dict(orient="records"),
    }
def _validate_products_row(row: dict, db: Session, company_id: int, seen_skus: set):
    name = str(row.get("Product Name", "")).strip()
    sku = str(row.get("SKU", "")).strip()
    category_name = str(row.get("Category", "")).strip()
    price = row.get("Unit Price", "")
    stock = row.get("Stock Quantity", "")

    if not name:
        return "invalid", "Product name is required."
    if not sku:
        return "invalid", "SKU is required."

    try:
        price = float(price)
        if price <= 0:
            return "invalid", "Price must be greater than zero."
    except (ValueError, TypeError):
        return "invalid", "Price must be a valid number."

    try:
        stock = int(stock)
        if stock < 0:
            return "invalid", "Stock cannot be negative."
    except (ValueError, TypeError):
        return "invalid", "Stock quantity must be a valid whole number."

    category = db.query(Category).filter(
        Category.company_id == company_id,
        Category.name.ilike(category_name)
    ).first()
    if not category:
        return "invalid", f"Category '{category_name}' not found."

    if sku in seen_skus:
        return "duplicate", "Duplicate SKU within this file."

    existing = db.query(Product).filter(
        Product.company_id == company_id,
        Product.sku == sku
    ).first()
    if existing:
        return "duplicate", "SKU already exists in the database."

    return "valid", None


def _validate_customers_row(row: dict, db: Session, company_id: int, seen_emails: set, seen_phones: set):
    name = str(row.get("Name", "")).strip()
    email = str(row.get("Email", "")).strip()
    phone = str(row.get("Phone", "")).strip()

    if not name:
        return "invalid", "Name is required."

    email_pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not email or not re.match(email_pattern, email):
        return "invalid", "A valid email is required."

    phone_pattern = r"^\+?[0-9\s\-]{7,15}$"
    if not phone or not re.match(phone_pattern, phone):
        return "invalid", "A valid phone number is required."

    if email in seen_emails or phone in seen_phones:
        return "duplicate", "Duplicate email or phone within this file."

    existing = db.query(Customer).filter(
        Customer.company_id == company_id,
    ).filter(
        (Customer.email == email) | (Customer.phone == phone)
    ).first()
    if existing:
        return "duplicate", "Email or phone already exists in the database."

    return "valid", None


def _validate_sales_row(row: dict, db: Session, company_id: int):
    customer_name = str(row.get("Customer", "")).strip()
    product_name = str(row.get("Product", "")).strip()
    quantity = row.get("Quantity", "")
    unit_price = row.get("Unit Price", "")
    sale_date = str(row.get("Sale Date", "")).strip()

    customer = db.query(Customer).filter(
        Customer.company_id == company_id,
        Customer.full_name.ilike(customer_name)
    ).first()
    if not customer:
        return "invalid", f"Customer '{customer_name}' not found."

    product = db.query(Product).filter(
        Product.company_id == company_id,
        Product.name.ilike(product_name)
    ).first()
    if not product:
        return "invalid", f"Product '{product_name}' not found."

    try:
        quantity = int(quantity)
        if quantity <= 0:
            return "invalid", "Quantity must be greater than zero."
    except (ValueError, TypeError):
        return "invalid", "Quantity must be a valid whole number."

    if quantity > product.stock_quantity:
        return "invalid", f"Quantity exceeds available stock ({product.stock_quantity})."

    try:
        float(unit_price)
    except (ValueError, TypeError):
        return "invalid", "Unit price must be a valid number."

    try:
        dt.strptime(sale_date, "%Y-%m-%d")
    except ValueError:
        return "invalid", "Sale date must be in YYYY-MM-DD format."

    return "valid", None


def validate_rows(df: pd.DataFrame, import_type: str, db: Session, company_id: int):
    results = []
    seen_skus = set()
    seen_emails = set()
    seen_phones = set()

    for index, row in df.iterrows():
        row_dict = row.to_dict()
        row_number = index + 2 

        if import_type == "Products":
            status, reason = _validate_products_row(row_dict, db, company_id, seen_skus)
            if status in ("valid",):
                seen_skus.add(str(row_dict.get("SKU", "")).strip())
        elif import_type == "Customers":
            status, reason = _validate_customers_row(row_dict, db, company_id, seen_emails, seen_phones)
            if status == "valid":
                seen_emails.add(str(row_dict.get("Email", "")).strip())
                seen_phones.add(str(row_dict.get("Phone", "")).strip())
        elif import_type == "Sales":
            status, reason = _validate_sales_row(row_dict, db, company_id)
        else:
            status, reason = "invalid", f"Unknown import type: {import_type}"

        results.append({
            "row_number": row_number,
            "status": status,
            "reason": reason,
            "data": row_dict,
        })

    total = len(results)
    valid = len([r for r in results if r["status"] == "valid"])
    invalid = len([r for r in results if r["status"] == "invalid"])
    duplicate = len([r for r in results if r["status"] == "duplicate"])

    return {
        "total_records": total,
        "valid_records": valid,
        "invalid_records": invalid,
        "duplicate_records": duplicate,
        "rows": results,
    }
def _insert_product_row(db: Session, company_id: int, row: dict):
    category = db.query(Category).filter(
        Category.company_id == company_id,
        Category.name.ilike(str(row.get("Category", "")).strip())
    ).first()

    product = Product(
        company_id=company_id,
        category_id=category.id,
        name=str(row.get("Product Name", "")).strip(),
        sku=str(row.get("SKU", "")).strip(),
        brand="",
        description="",
        unit_price=float(row.get("Unit Price")),
        cost_price=float(row.get("Unit Price")),
        stock_quantity=int(row.get("Stock Quantity")),
        unit_of_measure="pcs",
        status="Active",
    )
    db.add(product)


def _insert_customer_row(db: Session, company_id: int, row: dict):
    generated_customer_id = f"CUST-{uuid.uuid4().hex[:8].upper()}"

    customer = Customer(
        company_id=company_id,
        customer_id=generated_customer_id,
        full_name=str(row.get("Name", "")).strip(),
        email=str(row.get("Email", "")).strip(),
        phone=str(row.get("Phone", "")).strip(),
    )
    db.add(customer)


def _insert_sale_row(db: Session, company_id: int, user_id: int, row: dict):
    customer = db.query(Customer).filter(
        Customer.company_id == company_id,
        Customer.full_name.ilike(str(row.get("Customer", "")).strip())
    ).first()

    product = db.query(Product).filter(
        Product.company_id == company_id,
        Product.name.ilike(str(row.get("Product", "")).strip())
    ).first()

    quantity = int(row.get("Quantity"))
    unit_price = float(row.get("Unit Price"))
    subtotal = quantity * unit_price

    invoice_number = generate_invoice_number(db, company_id)

    sale = Sale(
        company_id=company_id,
        invoice_number=invoice_number,
        customer_id=customer.id,
        customer_name=customer.full_name,
        payment_method="Imported",
        notes="Imported via CSV",
        subtotal=subtotal,
        discount=0,
        tax=0,
        total_amount=subtotal,
        status="Completed",
        created_by=user_id,
    )
    db.add(sale)
    db.flush()

    sale_item = SaleItem(
        sale_id=sale.id,
        product_id=product.id,
        category_id=product.category_id,
        quantity=quantity,
        unit_price=unit_price,
        discount=0,
        tax=0,
        total=subtotal,
    )
    db.add(sale_item)

    product.stock_quantity -= quantity


def process_import(db: Session, company_id: int, user_id: int, import_type: str, filename: str, df: pd.DataFrame):
    """
    TRANSACTION STRATEGY (documented per spec requirement #17):
    - Every row is validated BEFORE any database write. Rows that fail
      business-rule validation (missing fields, bad values, duplicates)
      are never inserted - they're recorded as failed/duplicate from the
      start and don't affect the transaction at all.
    - All rows that pass validation are inserted together as a SINGLE
      database transaction. If an unexpected error occurs partway through
      (e.g. a database constraint violation we didn't anticipate), the
      ENTIRE batch is rolled back - no partial data is left in the
      database. The import is marked "Failed" and the admin can retry.
    - This is an all-or-nothing strategy for the valid-rows batch,
      combined with pre-filtering of invalid/duplicate rows. It favors
      data integrity over partial success.
    """
    validation = validate_rows(df, import_type, db, company_id)

    import_history = ImportHistory(
        company_id=company_id,
        import_type=import_type,
        filename=filename,
        uploaded_by=user_id,
        total_records=validation["total_records"],
        status="Processing",
    )
    db.add(import_history)
    db.commit()
    db.refresh(import_history)

    valid_rows = [r for r in validation["rows"] if r["status"] == "valid"]
    problem_rows = [r for r in validation["rows"] if r["status"] != "valid"]

    try:
        for row in valid_rows:
            if import_type == "Products":
                _insert_product_row(db, company_id, row["data"])
            elif import_type == "Customers":
                _insert_customer_row(db, company_id, row["data"])
            elif import_type == "Sales":
                _insert_sale_row(db, company_id, user_id, row["data"])

        db.commit()

        import_history.successful_records = len(valid_rows)
        import_history.failed_records = len([r for r in problem_rows if r["status"] == "invalid"])
        import_history.duplicate_records = len([r for r in problem_rows if r["status"] == "duplicate"])
        import_history.status = (
            "Completed" if not problem_rows else "Completed with Errors"
        )

    except Exception as e:
        import traceback
        print("=" * 60, flush=True)
        print("IMPORT ERROR:", flush=True)
        traceback.print_exc()
        print("=" * 60, flush=True)
        db.rollback()
        import_history.successful_records = 0
        import_history.failed_records = validation["total_records"]
        import_history.duplicate_records = 0
        import_history.status = "Failed"
        problem_rows = validation["rows"]  

    import_history.completed_at = datetime.utcnow()
    db.commit()

    for row in problem_rows:
        error_entry = ImportErrorModel(
            import_id=import_history.id,
            row_number=row["row_number"],
            error_reason=row["reason"] or "Import failed due to a database error.",
            row_data=json.dumps(row["data"]),
        )
        db.add(error_entry)

    db.commit()

    return {
        "import_id": import_history.id,
        "total_records": import_history.total_records,
        "successful_records": import_history.successful_records,
        "failed_records": import_history.failed_records,
        "duplicate_records": import_history.duplicate_records,
        "status": import_history.status,
    }

def get_import_history(db: Session, company_id: int):
    records = (
        db.query(ImportHistory)
        .filter(ImportHistory.company_id == company_id)
        .order_by(ImportHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "import_type": r.import_type,
            "filename": r.filename,
            "uploaded_by": r.uploaded_by,
            "upload_date": r.created_at,
            "total_records": r.total_records,
            "successful_records": r.successful_records,
            "failed_records": r.failed_records,
            "duplicate_records": r.duplicate_records,
            "status": r.status,
        }
        for r in records
    ]


def get_import_detail(db: Session, company_id: int, import_id: int):
    record = (
        db.query(ImportHistory)
        .filter(ImportHistory.id == import_id, ImportHistory.company_id == company_id)
        .first()
    )

    if not record:
        raise ValueError("Import record not found.")

    return {
        "id": record.id,
        "import_type": record.import_type,
        "filename": record.filename,
        "uploaded_by": record.uploaded_by,
        "upload_date": record.created_at,
        "completed_at": record.completed_at,
        "total_records": record.total_records,
        "successful_records": record.successful_records,
        "failed_records": record.failed_records,
        "duplicate_records": record.duplicate_records,
        "status": record.status,
    }


def get_import_errors(db: Session, company_id: int, import_id: int):
    record = (
        db.query(ImportHistory)
        .filter(ImportHistory.id == import_id, ImportHistory.company_id == company_id)
        .first()
    )

    if not record:
        raise ValueError("Import record not found.")

    errors = (
        db.query(ImportErrorModel)
        .filter(ImportErrorModel.import_id == import_id)
        .all()
    )

    return [
        {
            "row_number": e.row_number,
            "error_reason": e.error_reason,
            "row_data": json.loads(e.row_data) if e.row_data else {},
        }
        for e in errors
    ]