from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.database.database import Base
from app.database.database import engine
from app.api.profile import router as profile_router
from app.models.company import Company
from app.models.user import User
from app.api.admin import router as admin_router
from app.api.company import router as company_router
from app.api.audit import router as audit_router
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RetailPulse Analytics"
)

app.include_router(
    company_router,
    prefix="/company",
    tags=["Company"]
)

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)
app.include_router(
    profile_router,
    prefix="/profile",
    tags=["Profile"]
)
app.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin"]
)
app.include_router(
    audit_router,
    prefix="/audit",
    tags=["Audit Logs"]
)
@app.get("/")
def root():

    return {
        "message": "RetailPulse Backend Running"
    }