from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Query
from typing import Optional
from app.database.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


# Create Category
@router.post("/")
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):

    existing = db.query(Category).filter(
        Category.name == category.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    new_category = Category(
        company_id=1,
        name=category.name,
        description=category.description,
        status=category.status
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "message": "Category Created Successfully",
        "data": new_category
    }


# Get All Categories
@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


# Get Category By Id
@router.get("/{id}")
def get_category(id: int, db: Session = Depends(get_db)):

    category = db.query(Category).filter(
        Category.id == id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    return category


# Update Category
@router.put("/{id}")
def update_category(
    id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    category.name = data.name
    category.description = data.description
    category.status = data.status

    db.commit()

    return {
        "message": "Category Updated Successfully"
    }


# Delete Category
@router.delete("/{id}")
def delete_category(
    id: int,
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category Deleted Successfully"
    }

@router.get("/")
def get_categories(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Category)

    if search:
        query = query.filter(
            Category.name.ilike(f"%{search}%")
        )

    return query.all()

@router.put("/{category_id}")
def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    db_category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db_category.name = category.name
    db_category.company_id = category.company_id

    db.commit()
    db.refresh(db_category)

    return db_category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }