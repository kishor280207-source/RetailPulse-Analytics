from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.stock import StockUpdate
from app.dependencies.current_user import get_current_user
from app.dependencies.role import require_admin
from app.services.audit_service import create_audit_log
router = APIRouter()
@router.post("/")
def create_product(
    product: ProductCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):


    # Check category exists
    category = db.query(Category).filter(
        Category.id == product.category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    # SKU validation
    existing_sku = db.query(Product).filter(
        Product.company_id == 1,
        Product.sku == product.sku
    ).first()

    if existing_sku:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists."
        )

    # Duplicate product name in same category
    existing_product = db.query(Product).filter(
        Product.company_id == 1,
        Product.category_id == product.category_id,
        Product.name == product.name
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product already exists in this category."
        )

    # Price validations
    if product.unit_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price must be greater than zero."
        )

    if product.cost_price > product.unit_price:
        raise HTTPException(
            status_code=400,
            detail="Cost price cannot exceed unit price."
        )

    if product.stock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock cannot be negative."
        )

    new_product = Product(
        company_id=1,
        category_id=product.category_id,
        name=product.name,
        sku=product.sku,
        brand=product.brand,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        stock_quantity=product.stock_quantity,
        unit_of_measure=product.unit_of_measure,
        status=product.status
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    create_audit_log(
    db=db,
    company=str(current_user["company_id"]),
    user=current_user["sub"],
    action=f"Created Product: {new_product.name}",
    ip="127.0.0.1",
    browser="Swagger"
)

    return {
        "message": "Product created successfully",
        "product": new_product
    }
@router.get("/")
def get_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == 1
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return product

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):

    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == 1
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    db_product.name = product.name
    db_product.sku = product.sku
    db_product.category_id = product.category_id
    db_product.brand = product.brand
    db_product.description = product.description
    db_product.unit_price = product.unit_price
    db_product.cost_price = product.cost_price
    db_product.stock_quantity = product.stock_quantity
    db_product.unit_of_measure = product.unit_of_measure
    db_product.status = product.status

    db.commit()
    db.refresh(db_product)

    return {
        "message": "Product updated successfully",
        "product": db_product
    }

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user["compny_id"],
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }
@router.put("/{id}/increase-stock")
def increase_stock(
    id: int,
    stock: StockUpdate,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(Product.id == id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.stock_quantity += stock.quantity

    db.commit()

    return {
        "message": "Stock Increased",
        "stock": product.stock_quantity
    }
@router.put("/{id}/decrease-stock")
def decrease_stock(
    id: int,
    stock: StockUpdate,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(Product.id == id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.stock_quantity < stock.quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient Stock"
        )

    product.stock_quantity -= stock.quantity

    db.commit()

    return {
        "message": "Stock Updated",
        "stock": product.stock_quantity
    }
    