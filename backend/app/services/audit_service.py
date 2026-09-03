import json
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.middleware.request_context import get_current_ip, get_current_user_agent


def create_audit_log(
    db: Session,
    company_id: int,
    user_id: int,
    user_name: str,
    action: str,
    resource_type: str = None,
    resource_id=None,
    description: str = None,
    status: str = "Success",
    before_values: dict = None,
    after_values: dict = None,
):
    log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        user_name=user_name,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        description=description,
        status=status,
        before_values=json.dumps(before_values) if before_values else None,
        after_values=json.dumps(after_values) if after_values else None,
        ip_address=get_current_ip(),
        user_agent=get_current_user_agent(),
    )

    db.add(log)
    db.commit()