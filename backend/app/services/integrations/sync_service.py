
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.integration import (
    Integration,
    IntegrationSync,
    IntegrationFailedRecord
)
from app.models.product import Product
from app.services.integrations.csv_connector import read_csv_file


def run_csv_sync(
    db: Session,
    integration: Integration,
    company_id: int,
    user_id: int,
    file_content: bytes
):
    sync = IntegrationSync(
        company_id=company_id,
        integration_id=integration.id,
        triggered_by=user_id,
        status="Running",
        started_at=datetime.now(timezone.utc)
    )

    db.add(sync)
    db.flush()

    processed = inserted = updated = skipped = failed = 0

    try:
        if integration.target_module != "Products":
            raise ValueError(
                "The functional CSV connector currently supports Products"
            )

        records = read_csv_file(file_content)

        mappings = integration.field_mappings or []

        if not mappings:
            raise ValueError("Configure field mappings before synchronization")

        allowed_fields = {
            "name", "sku", "brand", "unit_price",
            "cost_price", "stock_quantity", "category_id"
        }

        for row_number, record in enumerate(records, start=2):
            processed += 1

            try:
                data = {}

                for mapping in mappings:
                    source = mapping.get("source_field")
                    target = mapping.get("target_field")

                    if target not in allowed_fields:
                        raise ValueError(
                            f"Unsupported target field: {target}"
                        )

                    value = record.get(source)

                    if mapping.get("required") and (
                        value is None or str(value).strip() == ""
                    ):
                        raise ValueError(
                            f"Required field missing: {source}"
                        )

                    if value is not None and str(value).strip() != "":
                        data[target] = value

                if not data.get("name") or not data.get("sku"):
                    raise ValueError("Product name and SKU are required")

                data["unit_price"] = float(data.get("unit_price", 0))
                data["cost_price"] = float(data.get("cost_price", 0))
                data["stock_quantity"] = int(
                    data.get("stock_quantity", 0)
                )

                if data["unit_price"] < 0 or data["cost_price"] < 0:
                    raise ValueError("Prices cannot be negative")

                if data["stock_quantity"] < 0:
                    raise ValueError("Stock cannot be negative")

                if data.get("category_id") not in (None, ""):
                    data["category_id"] = int(data["category_id"])

                product = (
                    db.query(Product)
                    .filter(
                        Product.company_id == company_id,
                        Product.sku == str(data["sku"])
                    )
                    .first()
                )

                if product:
                    strategy = integration.duplicate_strategy

                    if strategy == "skip":
                        skipped += 1
                        continue

                    if strategy == "reject":
                        raise ValueError("Duplicate SKU")

                    if strategy == "insert":
                        raise ValueError("Duplicate SKU cannot be inserted")

                    if strategy == "update":
                        if "category_id" in data:
                            raise ValueError(
                                "Category changes require separate validation"
                            )

                        for field in (
                            "name", "brand", "unit_price",
                            "cost_price", "stock_quantity"
                        ):
                            if field in data:
                                setattr(product, field, data[field])

                        updated += 1

                else:
                    if data.get("category_id") is None:
                        raise ValueError("Category ID is required")

                    from app.models.category import Category

                    category = (
                        db.query(Category)
                        .filter(
                            Category.id == data["category_id"],
                            Category.company_id == company_id
                        )
                        .first()
                    )

                    if not category:
                        raise ValueError("Invalid category ID")

                    db.add(
                        Product(
                            company_id=company_id,
                            category_id=data["category_id"],
                            name=data["name"],
                            sku=str(data["sku"]),
                            brand=data.get("brand", ""),
                            unit_price=data["unit_price"],
                            cost_price=data["cost_price"],
                            stock_quantity=data["stock_quantity"],
                            status=(
                                "Out Of Stock"
                                if data["stock_quantity"] == 0
                                else "Active"
                            )
                        )
                    )

                    inserted += 1

            except Exception as error:
                failed += 1

                db.add(
                    IntegrationFailedRecord(
                        company_id=company_id,
                        integration_id=integration.id,
                        sync_id=sync.id,
                        source_record_id=str(record.get("sku", "")),
                        row_number=row_number,
                        error_category="Validation Error",
                        error_message=str(error),
                        raw_record=record,
                        processing_status="Failed",
                        retry_count=0
                    )
                )

        sync.records_processed = processed
        sync.records_inserted = inserted
        sync.records_updated = updated
        sync.records_skipped = skipped
        sync.records_failed = failed

        sync.status = "Completed" if failed == 0 else "Completed With Errors"

        integration.last_sync_at = datetime.now(timezone.utc)
        integration.status = "active"
        integration.is_operational = True

        sync.completed_at = datetime.now(timezone.utc)
        sync.duration_seconds = (
            sync.completed_at - sync.started_at
        ).total_seconds()

        db.commit()
        db.refresh(sync)

        return sync

    except Exception as error:
        db.rollback()

        sync.status = "Failed"
        sync.error_message = str(error)
        sync.completed_at = datetime.now(timezone.utc)

        db.add(sync)
        db.commit()
        db.refresh(sync)

        raise
