from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.role import require_admin
from app.services.import_service import parse_csv, get_preview
from app.services.import_service import parse_csv, get_preview, validate_rows, process_import
from app.dependencies.auth import get_current_user

from app.services.import_service import (
    parse_csv,
    get_preview,
    validate_rows,
    process_import,
    get_import_history,
    get_import_detail,
    get_import_errors,
)

router = APIRouter()


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

    return process_import(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
        import_type=import_type,
        filename=file.filename,
        df=df,
    )

@router.get("/history")
def import_history_list(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return get_import_history(db=db, company_id=current_user["company_id"])


@router.get("/{import_id}")
def import_detail(
    import_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_import_detail(db=db, company_id=current_user["company_id"], import_id=import_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{import_id}/errors")
def import_errors(
    import_id: int,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_import_errors(db=db, company_id=current_user["company_id"], import_id=import_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))