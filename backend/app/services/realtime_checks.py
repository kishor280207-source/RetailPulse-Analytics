
from app.services.reconciliation_service import _record_issue_if_new


def check_single_sale(db, company_id: int, sale, customer, product_ids_and_items: list):
    """Run right after a sale is created - checks just this one sale."""
    issues_found = 0

    if not customer:
        if _record_issue_if_new(db, company_id, None, {
            "issue_type": "InvalidCustomerReference",
            "severity": "High",
            "affected_module": "Sales",
            "affected_record_id": sale.id,
            "description": f"Sale {sale.invoice_number} references a customer that could not be found.",
            "details": {"sale_id": sale.id},
            "dedup_key": f"invalid_customer:{sale.id}",
        }):
            issues_found += 1

    expected_total = round((sale.subtotal or 0) - (sale.discount or 0) + (sale.tax or 0), 2)
    actual_total = round(sale.total_amount or 0, 2)
    if abs(expected_total - actual_total) > 0.01:
        if _record_issue_if_new(db, company_id, None, {
            "issue_type": "ReportTotalMismatch",
            "severity": "High",
            "affected_module": "Reports",
            "affected_record_id": sale.id,
            "description": f"Sale {sale.invoice_number}: expected total {expected_total}, recorded total {actual_total}.",
            "details": {"expected": expected_total, "actual": actual_total, "sale_id": sale.id},
            "dedup_key": f"total_mismatch:{sale.id}",
        }):
            issues_found += 1

    return issues_found


def check_single_movement(db, company_id: int, movement):
    """Run right after a stock movement is recorded - checks just this one movement."""
    expected = (movement.previous_quantity or 0) + (movement.quantity_changed or 0)
    if expected != movement.updated_quantity:
        _record_issue_if_new(db, company_id, None, {
            "issue_type": "InventoryMovementMismatch",
            "severity": "Medium",
            "affected_module": "Inventory",
            "affected_record_id": movement.id,
            "description": f"Movement #{movement.id}: previous ({movement.previous_quantity}) + change ({movement.quantity_changed}) = {expected}, but recorded as {movement.updated_quantity}.",
            "details": {"expected": expected, "actual": movement.updated_quantity, "movement_id": movement.id},
            "dedup_key": f"movement_mismatch:{movement.id}",
        })