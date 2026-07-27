from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user

from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate
)
from app.schemas.inventory import StockAdjustment

from app.services.inventory_service import (
    create_inventory,
    get_inventory,
    update_inventory,
    add_stock,
    remove_stock
)
from app.services.inventory_service import get_inventory_dashboard
from fastapi import Query
from app.services.inventory_service import search_inventory
from sqlalchemy import func
from app.models.product import Product
router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.post("/")
def add_inventory(
    data: InventoryCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return create_inventory(
        db=db,
        data=data,
        company_id=user["company_id"]
    )


@router.get("/")
def inventory_list(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return get_inventory(
        db=db,
        company_id=user["company_id"]
    )


@router.put("/{inventory_id}")
def edit_inventory(
    inventory_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return update_inventory(
        db=db,
        inventory_id=inventory_id,
        data=data,
        company_id=user["company_id"]
    )
@router.put("/{inventory_id}/add-stock")
def stock_in(
    inventory_id: int,
    data: StockAdjustment,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return add_stock(
        db,
        inventory_id,
        data,
        user["company_id"],
        user["user_id"]
    )


@router.put("/{inventory_id}/remove-stock")
def stock_out(
    inventory_id: int,
    data: StockAdjustment,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return remove_stock(
        db,
        inventory_id,
        data,
        user["company_id"],
        user["user_id"]
    )
@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return get_inventory_dashboard(
        db,
        user["company_id"]
    )
@router.get("/search")
def search_inventory_api(
    product_name: str = Query(None),
    sku: str = Query(None),
    stock_status: str = Query(None),
    brand: str = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return search_inventory(
        db=db,
        company_id=user["company_id"],
        product_name=product_name,
        sku=sku,
        stock_status=stock_status,
        brand=brand
    )
@router.get("/dashboard/charts")
def inventory_charts(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    category_chart = (
        db.query(
            Product.category_id,
            func.count(Product.id)
        )
        .join(
            Inventory,
            Inventory.product_id == Product.id
        )
        .filter(
            Inventory.company_id == user["company_id"]
        )
        .group_by(Product.category_id)
        .all()
    )

    stock_chart = (
        db.query(
            Inventory.stock_status,
            func.count(Inventory.id)
        )
        .filter(
            Inventory.company_id == user["company_id"]
        )
        .group_by(
            Inventory.stock_status
        )
        .all()
    )

    return {
        "category_chart": category_chart,
        "stock_chart": stock_chart
    }