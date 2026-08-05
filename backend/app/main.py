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
from app.models.category import Category
from app.models.product import Product
from app.models.refresh_token import RefreshToken
from app.api.category import router as category_router
from app.api.product import router as product_router
from app.api.dashboard import router as dashboard_router
from app.models.sales import Sale
from app.models.sale_item import SaleItem
from app.api.sales import router as sales_router
from app.models.notification import Notification
from app.api.notification import router as notification_router
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.api.inventory import router as inventory_router
from app.api.inventory_movement import router as inventory_movement_router
from fastapi.middleware.cors import CORSMiddleware
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.api.customer import router as customer_router
from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory
from app.api.demand_forecast import router as demand_forecast_router
from app.api.forecast import router as forecast_router


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
app.include_router(
    category_router,
    prefix="/api",
    tags=["Categories"]
)
app.include_router(
    category_router,
    prefix="/categories",
    tags=["Categories"]
)
app.include_router(
    product_router,
    prefix="/api",
    tags=["Products"]
)
app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)
app.include_router(
    sales_router,
    prefix="/sales",
    tags=["Sales"]
)
app.include_router(
    notification_router,
    prefix="/notifications",
    tags=["Notifications"]
)
app.include_router(
    inventory_router
)
app.include_router(
    inventory_movement_router
)
app.include_router(
    customer_router,
    prefix="/customer",
    tags=["Customer"]
)


app.include_router(
    forecast_router,
    prefix="/forecast",
    tags=["Forecast"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():

    return {
        "message": "RetailPulse Backend Running"
    }