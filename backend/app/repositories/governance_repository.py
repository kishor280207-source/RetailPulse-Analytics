from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException

from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.user_role_history import UserRoleHistory
from app.models.access_review import AccessReview
from app.models.sensitive_field import SensitiveFieldConfig
from app.models.governance_change_log import GovernanceChangeLog
from app.models.workflow_request import WorkflowRequest

MODULES = [
    "Sales", "Inventory", "Customers", "Reports", "Import",
    "Reconciliation", "Monitoring", "AuditLogs", "Workflow",
    "Notifications", "DataGovernance", "Users",
]

ACTION_COLUMNS = ["can_view", "can_create", "can_edit", "can_delete", "can_export", "can_approve", "can_manage_access"]




def get_dashboard_summary(db: Session, company_id: int) -> dict:
    total_roles = db.query(Role).filter(Role.company_id == company_id, Role.is_active == True).count()
    total_users = db.query(User).filter(User.company_id == company_id).count()

    pending_access_requests = (
        db.query(WorkflowRequest)
        .filter(
            WorkflowRequest.company_id == company_id,
            WorkflowRequest.request_type == "AccessRequest",
            WorkflowRequest.status == "Pending Approval",
        )
        .count()
    )

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    permission_changes_30d = (
        db.query(GovernanceChangeLog)
        .filter(GovernanceChangeLog.company_id == company_id, GovernanceChangeLog.created_at >= thirty_days_ago)
        .count()
    )

    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    last_reviewed_subq = (
        db.query(AccessReview.user_id, func.max(AccessReview.created_at).label("last_reviewed"))
        .filter(AccessReview.company_id == company_id)
        .group_by(AccessReview.user_id)
        .subquery()
    )
    reviewed_user_ids = {row.user_id for row in db.query(last_reviewed_subq.c.user_id).filter(last_reviewed_subq.c.last_reviewed >= ninety_days_ago).all()}
    all_user_ids = {row.id for row in db.query(User.id).filter(User.company_id == company_id).all()}
    users_needing_review = len(all_user_ids - reviewed_user_ids)

    sensitive_fields_count = db.query(SensitiveFieldConfig).filter(SensitiveFieldConfig.company_id == company_id).count()

    role_breakdown = (
        db.query(User.role, func.count(User.id))
        .filter(User.company_id == company_id)
        .group_by(User.role)
        .all()
    )

    return {
        "total_roles": total_roles,
        "total_users": total_users,
        "pending_access_requests": pending_access_requests,
        "permission_changes_last_30_days": permission_changes_30d,
        "users_needing_review": users_needing_review,
        "sensitive_fields_configured": sensitive_fields_count,
        "role_breakdown": [{"role": r, "count": c} for r, c in role_breakdown],
    }



def list_roles(db: Session, company_id: int):
    roles = db.query(Role).filter(Role.company_id == company_id).order_by(Role.role_name).all()
    result = []
    for r in roles:
        user_count = db.query(User).filter(User.company_id == company_id, User.role == r.role_name).count()
        result.append({
            "id": r.id, "role_name": r.role_name, "description": r.description,
            "is_system_role": r.is_system_role, "is_active": r.is_active,
            "user_count": user_count, "created_at": r.created_at, "updated_at": r.updated_at,
        })
    return result


def get_role_or_404(db: Session, company_id: int, role_id: int) -> Role:
    role = db.query(Role).filter(Role.id == role_id, Role.company_id == company_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    return role


def create_role(db: Session, company_id: int, role_name: str, description: str, created_by: int, created_by_name: str) -> Role:
    existing = db.query(Role).filter(Role.company_id == company_id, Role.role_name == role_name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Role '{role_name}' already exists.")

    role = Role(
        company_id=company_id, role_name=role_name, description=description,
        is_system_role=False, is_active=True,
        created_by=created_by, created_by_name=created_by_name,
    )
    db.add(role)
    db.commit()
    db.refresh(role)


    for module in MODULES:
        db.add(Permission(company_id=company_id, role_name=role_name, module=module))
    db.commit()

    return role


def update_role(db: Session, company_id: int, role_id: int, description: str = None, is_active: bool = None) -> Role:
    role = get_role_or_404(db, company_id, role_id)

    if is_active is False and role.is_system_role:
        raise HTTPException(status_code=400, detail="System roles (Admin) cannot be deactivated.")

    if is_active is False:
        active_users_with_role = db.query(User).filter(User.company_id == company_id, User.role == role.role_name).count()
        if active_users_with_role > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot deactivate '{role.role_name}': {active_users_with_role} user(s) are still assigned this role. Reassign them first.",
            )

    if description is not None:
        role.description = description
    if is_active is not None:
        role.is_active = is_active

    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, company_id: int, role_id: int):
    role = get_role_or_404(db, company_id, role_id)
    if role.is_system_role:
        raise HTTPException(status_code=400, detail="System roles (Admin) cannot be deleted.")

    users_with_role = db.query(User).filter(User.company_id == company_id, User.role == role.role_name).count()
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete '{role.role_name}': {users_with_role} user(s) are still assigned this role.")

    db.query(Permission).filter(Permission.company_id == company_id, Permission.role_name == role.role_name).delete()
    db.delete(role)
    db.commit()


def count_active_admins(db: Session, company_id: int, exclude_user_id: int = None) -> int:
    query = db.query(User).filter(User.company_id == company_id, User.role == "Admin", User.status == "Active")
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    return query.count()



def get_permission_matrix(db: Session, company_id: int):
    roles = db.query(Role).filter(Role.company_id == company_id, Role.is_active == True).order_by(Role.role_name).all()
    matrix = []
    for role in roles:
        perms = db.query(Permission).filter(Permission.company_id == company_id, Permission.role_name == role.role_name).all()
        by_module = {p.module: p for p in perms}
        modules_out = []
        for module in MODULES:
            p = by_module.get(module)
            if role.role_name == "Admin":
                modules_out.append({"module": module, **{col: True for col in ACTION_COLUMNS}, "locked": True})
            else:
                modules_out.append({
                    "module": module,
                    "can_view": p.can_view if p else False,
                    "can_create": p.can_create if p else False,
                    "can_edit": p.can_edit if p else False,
                    "can_delete": p.can_delete if p else False,
                    "can_export": p.can_export if p else False,
                    "can_approve": p.can_approve if p else False,
                    "can_manage_access": p.can_manage_access if p else False,
                    "locked": False,
                })
        matrix.append({"role_name": role.role_name, "is_system_role": role.is_system_role, "modules": modules_out})
    return {"modules": MODULES, "actions": [c.replace("can_", "") for c in ACTION_COLUMNS], "roles": matrix}


def get_permission_row(db: Session, company_id: int, role_name: str, module: str) -> Permission:
    row = db.query(Permission).filter(Permission.company_id == company_id, Permission.role_name == role_name, Permission.module == module).first()
    if not row:
        row = Permission(company_id=company_id, role_name=role_name, module=module)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_permission_row(db: Session, company_id: int, role_name: str, module: str, data: dict, updated_by: int, updated_by_name: str) -> Permission:
    if role_name == "Admin":
        raise HTTPException(status_code=400, detail="Admin always has full access and cannot be restricted.")
    if module not in MODULES:
        raise HTTPException(status_code=400, detail=f"Unknown module: {module}")

    row = get_permission_row(db, company_id, role_name, module)

    old_snapshot = ", ".join(f"{col.replace('can_', '')}={getattr(row, col)}" for col in ACTION_COLUMNS)

    for col in ACTION_COLUMNS:
        if col in data:
            setattr(row, col, bool(data[col]))

    row.updated_by = updated_by
    row.updated_by_name = updated_by_name
    db.commit()
    db.refresh(row)

    new_snapshot = ", ".join(f"{col.replace('can_', '')}={getattr(row, col)}" for col in ACTION_COLUMNS)

    log_change(
        db, company_id, change_type="PermissionMatrixUpdate", target_type="Permission",
        target_id=f"{role_name}:{module}", target_label=f"{role_name} / {module}",
        old_value=old_snapshot, new_value=new_snapshot,
        changed_by=updated_by, changed_by_name=updated_by_name,
    )
    return row


def list_users_with_roles(db: Session, company_id: int, search: str = None, role_filter: str = None, page: int = 1, limit: int = 25):
    query = db.query(User).filter(User.company_id == company_id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))
    if role_filter:
        query = query.filter(User.role == role_filter)

    total = query.count()
    users = query.order_by(User.name).offset((page - 1) * limit).limit(limit).all()

    items = []
    for u in users:
        last_review = (
            db.query(AccessReview)
            .filter(AccessReview.company_id == company_id, AccessReview.user_id == u.id)
            .order_by(AccessReview.created_at.desc())
            .first()
        )
        items.append({
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "status": u.status, "last_login": u.last_login, "created_at": u.created_at,
            "last_reviewed_at": last_review.created_at if last_review else None,
        })

    return {"items": items, "total": total, "page": page, "limit": limit}


def create_role_history(db: Session, company_id: int, user_id: int, user_name: str, old_role: str, new_role: str,
                         changed_by: int, changed_by_name: str, reason: str, source: str = "Direct", workflow_request_id: int = None):
    entry = UserRoleHistory(
        company_id=company_id, user_id=user_id, user_name=user_name,
        old_role=old_role, new_role=new_role,
        changed_by=changed_by, changed_by_name=changed_by_name,
        reason=reason, source=source, workflow_request_id=workflow_request_id,
    )
    db.add(entry)
    db.commit()
    return entry


def list_role_history(db: Session, company_id: int, user_id: int = None, page: int = 1, limit: int = 25):
    query = db.query(UserRoleHistory).filter(UserRoleHistory.company_id == company_id)
    if user_id:
        query = query.filter(UserRoleHistory.user_id == user_id)
    total = query.count()
    items = query.order_by(UserRoleHistory.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}


def list_access_reviews(db: Session, company_id: int, page: int = 1, limit: int = 25):
    query = db.query(AccessReview).filter(AccessReview.company_id == company_id)
    total = query.count()
    items = query.order_by(AccessReview.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}


def create_access_review(db: Session, company_id: int, user_id: int, user_name: str, reviewed_by: int, reviewed_by_name: str,
                          role_at_review: str, decision: str, new_role: str = None, notes: str = None):
    now = datetime.utcnow()
    review_period = f"{now.year}-Q{(now.month - 1) // 3 + 1}"
    entry = AccessReview(
        company_id=company_id, user_id=user_id, user_name=user_name,
        reviewed_by=reviewed_by, reviewed_by_name=reviewed_by_name,
        role_at_review=role_at_review, decision=decision, new_role=new_role,
        notes=notes, review_period=review_period,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_sensitive_fields(db: Session, company_id: int):
    return db.query(SensitiveFieldConfig).filter(SensitiveFieldConfig.company_id == company_id).order_by(SensitiveFieldConfig.module, SensitiveFieldConfig.field_name).all()


def upsert_sensitive_field(db: Session, company_id: int, module: str, field_name: str, protection_level: str, allowed_roles: str, updated_by: int, updated_by_name: str):
    row = db.query(SensitiveFieldConfig).filter(
        SensitiveFieldConfig.company_id == company_id,
        SensitiveFieldConfig.module == module,
        SensitiveFieldConfig.field_name == field_name,
    ).first()
    if not row:
        row = SensitiveFieldConfig(company_id=company_id, module=module, field_name=field_name)
        db.add(row)

    row.protection_level = protection_level
    row.allowed_roles = allowed_roles
    row.updated_by = updated_by
    row.updated_by_name = updated_by_name
    db.commit()
    db.refresh(row)
    return row


def log_change(db: Session, company_id: int, change_type: str, target_type: str, target_id: str, target_label: str,
                old_value: str, new_value: str, changed_by: int, changed_by_name: str, reason: str = None):
    entry = GovernanceChangeLog(
        company_id=company_id, change_type=change_type, target_type=target_type,
        target_id=str(target_id) if target_id is not None else None, target_label=target_label,
        old_value=old_value, new_value=new_value,
        changed_by=changed_by, changed_by_name=changed_by_name, reason=reason,
    )
    db.add(entry)
    db.commit()
    return entry


def list_change_log(db: Session, company_id: int, page: int = 1, limit: int = 25, change_type: str = None):
    query = db.query(GovernanceChangeLog).filter(GovernanceChangeLog.company_id == company_id)
    if change_type:
        query = query.filter(GovernanceChangeLog.change_type == change_type)
    total = query.count()
    items = query.order_by(GovernanceChangeLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}
