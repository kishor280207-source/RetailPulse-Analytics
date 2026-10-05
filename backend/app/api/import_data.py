from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
import io

from app.database.database import get_db, engine
from app.dependencies.role import require_admin
from app.services.import_service import (
    parse_csv,
    get_preview,
    validate_rows,
    start_import,
    get_import_status,
    get_import_history,
    get_import_detail,
    get_import_errors,
)

router = APIRouter()

SessionFactory = sessionmaker(bind=engine)

TEMPLATES = {
    "Products": "Product Name,SKU,Category,Unit Price,Stock Quantity\n",
    "Customers": "Name,Email,Phone\n",
    "Sales": "Customer,Product,Quantity,Unit Price,Sale Date\n",
    "Inventory": "SKU,Current Stock,Reorder Level\n",
}


@router.get("/history")
def import_history_list(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return get_import_history(db=db, company_id=current_user["company_id"])


@router.get("/template/{import_type}")
def download_template(import_type: str, current_user: dict = Depends(require_admin)):
    content = TEMPLATES.get(import_type)
    if not content:
        raise HTTPException(status_code=404, detail="No template available for this import type.")
    return StreamingResponse(
        io.StringIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={import_type.lower()}_template.csv"},
    )


@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File is too large. Maximum size is 5MB.")
    try:
        df = parse_csv(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return get_preview(df, import_type)


@router.post("/validate")
async def validate_import(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    file_bytes = await file.read()
    try:
        df = parse_csv(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return validate_rows(df, import_type, db, current_user["company_id"])


@router.post("/process")
async def process_import_route(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    file_bytes = await file.read()
    try:
        df = parse_csv(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return start_import(
        db=db,
        db_session_factory=SessionFactory,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        user_name=current_user.get("sub", "Unknown"),
        import_type=import_type,
        filename=file.filename,
        df=df,
    )


@router.post("/{import_id}/cancel")
def cancel_import(import_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.import_history import ImportHistory
    history = db.query(ImportHistory).filter(ImportHistory.id == import_id, ImportHistory.company_id == current_user["company_id"]).first()
    if not history:
        raise HTTPException(status_code=404, detail="Import not found.")
    if history.status not in ("Processing", "Validating"):
        raise HTTPException(status_code=400, detail="Only an in-progress import can be cancelled.")
    history.status = "Cancelled"
    db.commit()
    return {"import_id": import_id, "status": "Cancelled"}


@router.get("/{import_id}/status")
def import_status(import_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return get_import_status(db=db, company_id=current_user["company_id"], import_id=import_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{import_id}")
def import_detail(import_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return get_import_detail(db=db, company_id=current_user["company_id"], import_id=import_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{import_id}/errors")
def import_errors(import_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return get_import_errors(db=db, company_id=current_user["company_id"], import_id=import_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))