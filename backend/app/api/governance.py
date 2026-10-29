from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permission import require_permission

from app.repositories import governance_repository as repo
from app.services import governance_service as service
from app.services.audit_service import create_audit_log

router = APIRouter(tags=["governance"])



@router.get("/dashboard")
def dashboard(current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db)):
    return repo.get_dashboard_summary(db, current_user["company_id"])



@router.get("/roles")
def list_roles(current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db)):
    return repo.list_roles(db, current_user["company_id"])


@router.post("/roles")
def create_role(data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    role_name = (data.get("role_name") or "").strip()
    if not role_name:
        raise HTTPException(status_code=400, detail="role_name is required.")

    role = repo.create_role(
        db, current_user["company_id"], role_name, data.get("description"),
        current_user["user_id"], current_user.get("sub", "Unknown"),
    )
    repo.log_change(
        db, current_user["company_id"], change_type="RoleCreated", target_type="Role",
        target_id=role.id, target_label=role.role_name,
        old_value=None, new_value=role.role_name,
        changed_by=current_user["user_id"], changed_by_name=current_user.get("sub", "Unknown"),
    )
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        action="CREATE", resource_type="Role", resource_id=role.id,
        description=f"Role '{role.role_name}' created",
    )
    return {"id": role.id, "role_name": role.role_name, "description": role.description, "is_active": role.is_active}


@router.put("/roles/{role_id}")
def update_role(role_id: int, data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    role = repo.update_role(db, current_user["company_id"], role_id, description=data.get("description"), is_active=data.get("is_active"))
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        action="UPDATE", resource_type="Role", resource_id=role.id,
        description=f"Role '{role.role_name}' updated",
    )
    return {"id": role.id, "role_name": role.role_name, "description": role.description, "is_active": role.is_active}


@router.delete("/roles/{role_id}")
def delete_role(role_id: int, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    role = repo.get_role_or_404(db, current_user["company_id"], role_id)
    role_name = role.role_name
    repo.delete_role(db, current_user["company_id"], role_id)
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        action="DELETE", resource_type="Role", resource_id=role_id,
        description=f"Role '{role_name}' deleted",
    )
    return {"detail": f"Role '{role_name}' deleted."}



@router.get("/permission-matrix")
def permission_matrix(current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db)):
    return repo.get_permission_matrix(db, current_user["company_id"])


@router.put("/permission-matrix/{role_name}/{module}")
def update_permission_matrix_cell(role_name: str, module: str, data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    row = repo.update_permission_row(db, current_user["company_id"], role_name, module, data, current_user["user_id"], current_user.get("sub", "Unknown"))
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        action="UPDATE", resource_type="Permission", resource_id=row.id,
        description=f"Permissions for '{role_name}' on module '{module}' updated",
    )
    return {
        "role_name": row.role_name, "module": row.module,
        "can_view": row.can_view, "can_create": row.can_create, "can_edit": row.can_edit,
        "can_delete": row.can_delete, "can_export": row.can_export, "can_approve": row.can_approve,
        "can_manage_access": row.can_manage_access,
    }




@router.get("/users")
def list_users(
    page: int = 1, limit: int = 25, search: Optional[str] = None, role: Optional[str] = None,
    current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db),
):
    return repo.list_users_with_roles(db, current_user["company_id"], search, role, page, limit)


@router.put("/users/{user_id}/role")
def assign_user_role(user_id: int, data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    new_role = data.get("role")
    reason = data.get("reason")
    if not new_role:
        raise HTTPException(status_code=400, detail="role is required.")
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="A reason is required for role changes.")

    return service.assign_role_direct(db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"), user_id, new_role, reason)


@router.get("/role-history")
def role_history(
    user_id: Optional[int] = None, page: int = 1, limit: int = 25,
    current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db),
):
    return repo.list_role_history(db, current_user["company_id"], user_id, page, limit)


@router.post("/access-requests")
def submit_access_request(data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    
    requested_role = data.get("requested_role")
    reason = data.get("reason")
    if not requested_role:
        raise HTTPException(status_code=400, detail="requested_role is required.")
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="reason is required.")

    return service.create_access_request(
        db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"),
        requested_role, reason, data.get("priority", "Medium"),
    )



@router.get("/access-reviews")
def access_reviews(page: int = 1, limit: int = 25, current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db)):
    return repo.list_access_reviews(db, current_user["company_id"], page, limit)


@router.post("/access-reviews")
def submit_access_review(data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    decision = data.get("decision")
    if not user_id or not decision:
        raise HTTPException(status_code=400, detail="user_id and decision are required.")

    return service.process_access_review(
        db, current_user["company_id"], current_user["user_id"], current_user.get("sub", "Unknown"),
        user_id, decision, data.get("new_role"), data.get("notes"),
    )



@router.get("/sensitive-fields")
def sensitive_fields(current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db)):
    rows = repo.list_sensitive_fields(db, current_user["company_id"])
    return [
        {"id": r.id, "module": r.module, "field_name": r.field_name, "protection_level": r.protection_level, "allowed_roles": r.allowed_roles}
        for r in rows
    ]


@router.put("/sensitive-fields")
def set_sensitive_field(data: dict, current_user: dict = Depends(require_permission("DataGovernance", "manage_access")), db: Session = Depends(get_db)):
    module = data.get("module")
    field_name = data.get("field_name")
    if not module or not field_name:
        raise HTTPException(status_code=400, detail="module and field_name are required.")

    row = repo.upsert_sensitive_field(
        db, current_user["company_id"], module, field_name,
        data.get("protection_level", "Masked"), data.get("allowed_roles", "Admin"),
        current_user["user_id"], current_user.get("sub", "Unknown"),
    )
    create_audit_log(
        db=db, company_id=current_user["company_id"], user_id=current_user["user_id"], user_name=current_user.get("sub", "Unknown"),
        action="UPDATE", resource_type="SensitiveField", resource_id=row.id,
        description=f"Sensitive field protection set for {module}.{field_name} ({row.protection_level})",
    )
    return {"id": row.id, "module": row.module, "field_name": row.field_name, "protection_level": row.protection_level, "allowed_roles": row.allowed_roles}




@router.get("/change-log")
def change_log(
    page: int = 1, limit: int = 25, change_type: Optional[str] = None,
    current_user: dict = Depends(require_permission("DataGovernance", "view")), db: Session = Depends(get_db),
):
    return repo.list_change_log(db, current_user["company_id"], page, limit, change_type)
