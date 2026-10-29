from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.role import Role

from app.repositories import governance_repository as repo
from app.services.audit_service import create_audit_log
from app.services.notification_service import create_notification
from app.services.workflow_service import create_and_submit_request


def _get_user_or_404(db: Session, company_id: int, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def assign_role_direct(db: Session, company_id: int, actor_id: int, actor_name: str,
                        target_user_id: int, new_role: str, reason: str):
    """
    Direct (immediate, no-approval) role assignment - this is the
    Admin-only path from the User Access Assignment page. The
    Access Request workflow (governance_service.create_access_request
    below) is the separate, approval-gated path a non-admin uses to
    ask for a role change.
    """
    target = _get_user_or_404(db, company_id, target_user_id)

    role_row = db.query(Role).filter(Role.company_id == company_id, Role.role_name == new_role, Role.is_active == True).first()
    if not role_row:
        raise HTTPException(status_code=400, detail=f"Role '{new_role}' does not exist or is inactive.")

    old_role = target.role
    if old_role == new_role:
        raise HTTPException(status_code=400, detail=f"User already has the role '{new_role}'.")

    if old_role == "Admin" and new_role != "Admin":
        remaining_admins = repo.count_active_admins(db, company_id, exclude_user_id=target.id)
        if remaining_admins < 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot change this user's role: they are the last active Admin for this company. Promote another user to Admin first.",
            )

    target.role = new_role
    db.commit()
    db.refresh(target)

    repo.create_role_history(
        db, company_id, target.id, target.name, old_role, new_role,
        actor_id, actor_name, reason, source="Direct",
    )
    repo.log_change(
        db, company_id, change_type="RoleAssignment", target_type="User",
        target_id=target.id, target_label=target.name,
        old_value=old_role, new_value=new_role,
        changed_by=actor_id, changed_by_name=actor_name, reason=reason,
    )
    create_audit_log(
        db=db, company_id=company_id, user_id=actor_id, user_name=actor_name,
        action="UPDATE", resource_type="UserRole", resource_id=target.id,
        description=f"{target.name}'s role changed from '{old_role}' to '{new_role}' by {actor_name}. Reason: {reason}",
    )
    create_notification(
        db=db, company_id=company_id, type="RoleChange", priority="Medium",
        title="Your role has changed",
        message=f"Your role was changed from '{old_role}' to '{new_role}' by {actor_name}.",
        user_id=target.id,
    )

    return {"id": target.id, "name": target.name, "old_role": old_role, "new_role": target.role}


def create_access_request(db: Session, company_id: int, user_id: int, user_name: str, requested_role: str, reason: str, priority: str = "Medium"):
    """
    This is the self-service path: a non-admin user requests a role
    change for THEMSELVES. It rides entirely on the existing Workflow
    & Approval Management engine (create_and_submit_request) - no
    separate approval table or admin inbox is created. The actual
    role change only happens if/when an Admin approves it, via the
    _apply_access_request handler patched into workflow_service.py
    (see governance_workflow_patch.md). Submitting this never grants
    access by itself.
    """
    role_row = db.query(Role).filter(Role.company_id == company_id, Role.role_name == requested_role, Role.is_active == True).first()
    if not role_row:
        raise HTTPException(status_code=400, detail=f"Role '{requested_role}' does not exist or is inactive.")

    return create_and_submit_request(
        db=db, company_id=company_id, user_id=user_id, user_name=user_name,
        request_type="AccessRequest", related_record_id=user_id,
        requested_values={"requested_role": requested_role},
        reason=reason, priority=priority,
    )


def process_access_review(db: Session, company_id: int, actor_id: int, actor_name: str,
                           target_user_id: int, decision: str, new_role: str = None, notes: str = None):
    if decision not in ("Confirmed", "Revoked", "Changed"):
        raise HTTPException(status_code=400, detail="decision must be one of: Confirmed, Revoked, Changed")

    target = _get_user_or_404(db, company_id, target_user_id)
    role_at_review = target.role

    if decision == "Changed":
        if not new_role:
            raise HTTPException(status_code=400, detail="new_role is required when decision is 'Changed'.")
        assign_role_direct(db, company_id, actor_id, actor_name, target_user_id, new_role, reason=notes or "Access review")
        db.refresh(target)

    if decision == "Revoked":
        if role_at_review == "Admin":
            remaining_admins = repo.count_active_admins(db, company_id, exclude_user_id=target.id)
            if remaining_admins < 1:
                raise HTTPException(status_code=400, detail="Cannot revoke access: this user is the last active Admin for this company.")
        target.status = "Inactive"
        db.commit()
        create_audit_log(
            db=db, company_id=company_id, user_id=actor_id, user_name=actor_name,
            action="UPDATE", resource_type="UserAccess", resource_id=target.id,
            description=f"{target.name}'s access revoked during access review by {actor_name}.",
        )
        create_notification(
            db=db, company_id=company_id, type="AccessReview", priority="High",
            title="Your access has been revoked",
            message=f"Your account access was revoked by {actor_name} during a periodic access review.",
            user_id=target.id,
        )

    review = repo.create_access_review(
        db, company_id, target.id, target.name, actor_id, actor_name,
        role_at_review=role_at_review, decision=decision,
        new_role=new_role if decision == "Changed" else None, notes=notes,
    )

    repo.log_change(
        db, company_id, change_type="AccessReview", target_type="User",
        target_id=target.id, target_label=target.name,
        old_value=role_at_review, new_value=(new_role if decision == "Changed" else decision),
        changed_by=actor_id, changed_by_name=actor_name, reason=notes,
    )

    return {
        "id": review.id, "user_id": target.id, "user_name": target.name,
        "decision": decision, "role_at_review": role_at_review, "new_role": new_role,
        "created_at": review.created_at,
    }
