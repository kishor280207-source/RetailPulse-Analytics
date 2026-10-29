"""
Backend-enforced permission checks for Data Governance (Task 20).

IMPORTANT: this is deliberately separate from require_admin (role.py).
require_admin is a blunt "must be Admin" gate already used across the
app (workflow config, etc.) and is left completely untouched.

require_permission(module, action) is a new, finer-grained gate: it
looks up the Permission Matrix row for the caller's company+role+module
and checks a specific action column. Because the check runs here, in a
FastAPI dependency that executes before the route body runs, a user
who manipulates the frontend (hides a button via browser devtools,
calls the API directly with curl/Postman) still gets a real 403 - this
is what satisfies the spec's "no silent frontend-only enforcement"
requirement. The frontend should ALSO hide buttons the user can't use
(for a clean UX), but that hiding is cosmetic only; this dependency is
the actual enforcement and must be applied to every governed endpoint.

Admin bypass: "Admin" (the system role, is_system_role=True) always
passes every check, regardless of what the Permission Matrix says.
This exists specifically so an Admin can never accidentally lock
themselves (or every Admin) out of the Permission Matrix screen by
misconfiguring their own row - see governance_service.py's
assert_admin_not_locked_out() for the matching write-side protection.
"""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.permission import Permission

VALID_ACTIONS = {"view", "create", "edit", "delete", "export", "approve", "manage_access"}


def has_permission(db: Session, company_id: int, role: str, module: str, action: str) -> bool:
    if role == "Admin":
        return True

    if action not in VALID_ACTIONS:
        return False

    perm = (
        db.query(Permission)
        .filter(
            Permission.company_id == company_id,
            Permission.role_name == role,
            Permission.module == module,
        )
        .first()
    )
    if not perm:
        return False

    return bool(getattr(perm, f"can_{action}", False))


def require_permission(module: str, action: str):
   
    if action not in VALID_ACTIONS:
        raise ValueError(f"Unknown permission action '{action}'. Valid actions: {sorted(VALID_ACTIONS)}")

    def _check(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> dict:
        role = current_user.get("role")
        company_id = current_user.get("company_id")

        if not role or not company_id:
            raise HTTPException(status_code=401, detail="Invalid session.")

        if not has_permission(db, company_id, role, module, action):
            raise HTTPException(
                status_code=403,
                detail=f"Your role ('{role}') does not have '{action}' access to {module}.",
            )

        return current_user

    return _check
