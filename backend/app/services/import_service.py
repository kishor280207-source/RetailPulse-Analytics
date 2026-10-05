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
from app.services.notification_service import create_notification
import time
import threading
from app.models.inventory import Inventory
from app.services.audit_service import create_audit_log

REQUIRED_COLUMNS = {
    "Products": ["Product Name", "SKU", "Category", "Unit Price", "Stock Quantity"],
    "Customers": ["Name", "Email", "Phone"],
    "Sales": ["Customer", "Product", "Quantity", "Unit Price", "Sale Date"],
    "Inventory": ["SKU", "Current Stock", "Reorder Level"],
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
    
    dedup_key = f"{customer.id}:{product.id}:{quantity}:{sale_date}"
    if dedup_key in seen_sales_keys:
        return "duplicate", "Duplicate sale (same customer, product, quantity, and date) appears more than once in this file."

    existing_sale = (
        db.query(Sale)
        .join(SaleItem, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.company_id == company_id,
            Sale.customer_id == customer.id,
            SaleItem.product_id == product.id,
            SaleItem.quantity == quantity,
            func.date(Sale.sale_date) == sale_date,
        )
        .first()
    )
    if existing_sale:
        return "duplicate", f"A matching sale already exists (invoice {existing_sale.invoice_number})."
    
    return "valid", None

def _validate_inventory_row(row: dict, db: Session, company_id: int, seen_skus: set):
    sku = str(row.get("SKU", "")).strip()
    current_stock = row.get("Current Stock", "")
    reorder_level = row.get("Reorder Level", "")

    if not sku:
        return "invalid", "SKU is required."

    product = db.query(Product).filter(Product.company_id == company_id, Product.sku == sku).first()
    if not product:
        return "invalid", f"No product found with SKU '{sku}'."

    try:
        current_stock = int(current_stock)
        if current_stock < 0:
            return "invalid", "Current stock cannot be negative."
    except (ValueError, TypeError):
        return "invalid", "Current stock must be a valid whole number."

    if reorder_level:
        try:
            int(reorder_level)
        except (ValueError, TypeError):
            return "invalid", "Reorder level must be a valid whole number."

    if sku in seen_skus:
        return "duplicate", "Duplicate SKU within this file - only the first occurrence will be applied."

    return "valid", None


def validate_rows(df: pd.DataFrame, import_type: str, db: Session, company_id: int):
    results = []
    seen_skus = set()
    seen_emails = set()
    seen_phones = set()
    seen_sales_keys = set()

    for index, row in df.iterrows():
        row_dict = row.to_dict()
        row_number = index + 2

        if import_type == "Products":
            status, reason = _validate_products_row(row_dict, db, company_id, seen_skus)
            if status == "valid":
                seen_skus.add(str(row_dict.get("SKU", "")).strip())
        elif import_type == "Customers":
            status, reason = _validate_customers_row(row_dict, db, company_id, seen_emails, seen_phones)
            if status == "valid":
                seen_emails.add(str(row_dict.get("Email", "")).strip())
                seen_phones.add(str(row_dict.get("Phone", "")).strip())
        elif import_type == "Sales":
            status, reason = _validate_sales_row(row_dict, db, company_id, seen_sales_keys)
            if status == "valid":
                customer = db.query(Customer).filter(Customer.company_id == company_id, Customer.full_name.ilike(str(row_dict.get("Customer", "")).strip())).first()
                product = db.query(Product).filter(Product.company_id == company_id, Product.name.ilike(str(row_dict.get("Product", "")).strip())).first()
                if customer and product:
                    key = f"{customer.id}:{product.id}:{row_dict.get('Quantity')}:{str(row_dict.get('Sale Date', '')).strip()}"
                    seen_sales_keys.add(key)
        elif import_type == "Inventory":
            status, reason = _validate_inventory_row(row_dict, db, company_id, seen_skus)
            if status == "valid":
                seen_skus.add(str(row_dict.get("SKU", "")).strip())
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


def _run_import_core(db: Session, company_id: int, user_id: int, user_name: str, import_type: str, filename: str, df: pd.DataFrame, import_id: int):
    history = db.query(ImportHistory).filter(ImportHistory.id == import_id).first()

   
    history.status = "Validating"
    db.commit()

    validation = validate_rows(df, import_type, db, company_id)
    history.total_records = validation["total_records"]
    db.commit()

    valid_rows = [r for r in validation["rows"] if r["status"] == "valid"]
    problem_rows = [r for r in validation["rows"] if r["status"] != "valid"]

    
    history.status = "Processing"
    db.commit()

    inserted_count = 0
    skipped_count = 0
    was_cancelled = False

    try:
        for row in valid_rows:
           
            db.refresh(history)
            if history.status == "Cancelled":
                was_cancelled = True
                skipped_count = len(valid_rows) - inserted_count
                break

            if import_type == "Products":
                _insert_product_row(db, company_id, row["data"])
            elif import_type == "Customers":
                _insert_customer_row(db, company_id, row["data"])
            elif import_type == "Sales":
                _insert_sale_row(db, company_id, user_id, row["data"])
            elif import_type == "Inventory":
                _update_inventory_row(db, company_id, row["data"])

            inserted_count += 1

        db.commit()

        if was_cancelled:
            history.successful_records = inserted_count
            history.skipped_records = skipped_count
            history.failed_records = len([r for r in problem_rows if r["status"] == "invalid"])
            history.duplicate_records = len([r for r in problem_rows if r["status"] == "duplicate"])
           
        else:
            history.successful_records = inserted_count
            history.skipped_records = 0
            history.failed_records = len([r for r in problem_rows if r["status"] == "invalid"])
            history.duplicate_records = len([r for r in problem_rows if r["status"] == "duplicate"])
            history.status = "Completed" if not problem_rows else "Completed with Errors"

    except Exception:
        import traceback
        traceback.print_exc()  
        db.rollback()
        history.successful_records = 0
        history.skipped_records = 0
        history.failed_records = validation["total_records"]
        history.duplicate_records = 0
        history.status = "Failed"
        problem_rows = validation["rows"]

    history.completed_at = datetime.utcnow()
    db.commit()

    for row in problem_rows:
        error_entry = ImportErrorModel(
            import_id=history.id,
            row_number=row["row_number"],
            error_reason=row["reason"] or "Import failed due to an internal error.",
            row_data=json.dumps(row["data"]),
        )
        db.add(error_entry)
    db.commit()

    
    if history.status == "Completed":
        create_notification(
            db=db, company_id=company_id, type="ImportCompleted", priority="Low",
            title="Import Completed",
            message=f"{import_type} import '{filename}' completed - {history.successful_records} records added.",
            resource_type="Import", resource_id=history.id,
            dedup_key=f"import_event:{history.id}:completed",
        )
    elif history.status == "Completed with Errors":
        create_notification(
            db=db, company_id=company_id, type="ImportCompleted", priority="Medium",
            title="Import Completed with Errors",
            message=f"{import_type} import '{filename}' finished with {history.failed_records} failed and {history.duplicate_records} duplicate records.",
            resource_type="Import", resource_id=history.id,
            dedup_key=f"import_event:{history.id}:completed_with_errors",
        )
    elif history.status == "Cancelled":
        create_notification(
            db=db, company_id=company_id, type="ImportFailed", priority="Medium",
            title="Import Cancelled",
            message=f"{import_type} import '{filename}' was cancelled - {history.successful_records} records added before cancellation, {history.skipped_records} skipped.",
            resource_type="Import", resource_id=history.id,
            dedup_key=f"import_event:{history.id}:cancelled",
        )
    else:
        create_notification(
            db=db, company_id=company_id, type="ImportFailed", priority="High",
            title="Import Failed",
            message=f"{import_type} import '{filename}' failed to process.",
            resource_type="Import", resource_id=history.id,
            dedup_key=f"import_event:{history.id}:failed",
        )

    
    create_audit_log(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        action="IMPORT", resource_type="Import", resource_id=history.id,
        description=f"Import {history.status}: {history.successful_records} succeeded, {history.failed_records} failed, {history.duplicate_records} duplicate, {history.skipped_records} skipped",
    )

    
    if import_type in ("Inventory", "Products") and history.successful_records > 0:
        from app.services.reconciliation_service import run_reconciliation
        try:
            run_reconciliation(db, company_id, user_id, f"System (triggered by import {history.id})")
        except Exception:
            pass

    return {
        "import_id": history.id,
        "total_records": history.total_records,
        "successful_records": history.successful_records,
        "failed_records": history.failed_records,
        "duplicate_records": history.duplicate_records,
        "skipped_records": history.skipped_records,
        "status": history.status,
    }


def process_import_async(db_session_factory, company_id: int, user_id: int, user_name: str, import_type: str, filename: str, df: pd.DataFrame, import_id: int):
    """
    Runs on a background thread so the triggering HTTP request returns
    immediately. HONEST LIMITATION: in-process threading, not a real job
    queue (Celery/RQ) - works at this project's scale, single server,
    doesn't survive a restart mid-import, doesn't scale across instances.
    """
    db = db_session_factory()
    try:
        start_time = time.time()
        _run_import_core(db, company_id, user_id, user_name, import_type, filename, df, import_id)
        duration = time.time() - start_time

        history = db.query(ImportHistory).filter(ImportHistory.id == import_id).first()
        if history:
            history.processing_duration_seconds = round(duration, 2)
            db.commit()
    finally:
        db.close()


def start_import(db: Session, db_session_factory, company_id: int, user_id: int, user_name: str, import_type: str, filename: str, df: pd.DataFrame):
    history = ImportHistory(
        company_id=company_id,
        import_type=import_type,
        filename=filename,
        uploaded_by=user_id,
        total_records=len(df),
        status="Processing",
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    create_audit_log(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        action="IMPORT", resource_type="Import", resource_id=history.id,
        description=f"Import started: {import_type} from {filename}",
    )

    thread = threading.Thread(
        target=process_import_async,
        args=(db_session_factory, company_id, user_id, user_name, import_type, filename, df, history.id),
    )
    thread.start()

    return {"import_id": history.id, "status": "Processing"}


def get_import_status(db: Session, company_id: int, import_id: int):
    history = db.query(ImportHistory).filter(ImportHistory.id == import_id, ImportHistory.company_id == company_id).first()
    if not history:
        raise ValueError("Import not found.")
    return {
        "import_id": history.id,
        "status": history.status,
        "total_records": history.total_records,
        "successful_records": history.successful_records,
        "failed_records": history.failed_records,
        "duplicate_records": history.duplicate_records,
        "processing_duration_seconds": history.processing_duration_seconds,
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
            "processing_duration_seconds": r.processing_duration_seconds,
            "skipped_records": r.skipped_records,
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
        "processing_duration_seconds": record.processing_duration_seconds,
        "skipped_records": record.skipped_records,
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