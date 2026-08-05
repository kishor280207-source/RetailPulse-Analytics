from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    company: str,
    user: str,
    action: str,
    ip: str,
    browser: str
):

    log = AuditLog(
        company=company,
        user=user,
        action=action,
        ip_address=ip,
        browser=browser
    )

    db.add(log)
    db.commit()
    