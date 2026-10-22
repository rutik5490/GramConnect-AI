import csv
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.core_models import User
from app.models.citizen_models import Citizen, Family
from app.schemas.citizen_schemas import (
    CitizenCreate,
    CitizenUpdate,
    CitizenOut,
    FamilyCreate,
    FamilyOut,
)
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/api/citizens", tags=["Citizens"])


def _generate_citizen_code() -> str:
    return f"CTZ-{uuid.uuid4().hex[:8].upper()}"


@router.post("", response_model=CitizenOut, status_code=201)
def create_citizen(
    payload: CitizenCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin", "gram_sevak", "data_entry_operator")),
):
    citizen = Citizen(citizen_code=_generate_citizen_code(), **payload.model_dump())
    db.add(citizen)
    db.commit()
    db.refresh(citizen)
    return citizen


@router.get("", response_model=list[CitizenOut])
def list_citizens(
    ward_id: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Citizen)
    if ward_id:
        q = q.filter(Citizen.ward_id == ward_id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Citizen.name.ilike(like), Citizen.mobile_number.ilike(like), Citizen.citizen_code.ilike(like)))
    return q.order_by(Citizen.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{citizen_id}", response_model=CitizenOut)
def get_citizen(citizen_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    return citizen


@router.patch("/{citizen_id}", response_model=CitizenOut)
def update_citizen(
    citizen_id: str,
    payload: CitizenUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin", "gram_sevak", "data_entry_operator")),
):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(citizen, field, value)
    citizen.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(citizen)
    return citizen


@router.delete("/{citizen_id}")
def delete_citizen(
    citizen_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    db.delete(citizen)
    db.commit()
    return {"message": "Citizen deleted"}


@router.post("/import-csv")
def import_citizens_csv(
    ward_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin", "data_entry_operator")),
):
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            citizen = Citizen(
                citizen_code=_generate_citizen_code(),
                name=row["name"].strip(),
                mobile_number=row["mobile_number"].strip(),
                address=row.get("address"),
                ward_id=ward_id,
                age=int(row["age"]) if row.get("age") else None,
                occupation=row.get("occupation"),
                annual_income=int(row["annual_income"]) if row.get("annual_income") else None,
                category=row.get("category"),
            )
            db.add(citizen)
            created += 1
        except Exception as exc:
            errors.append(f"Row {i}: {exc}")
    db.commit()
    return {"created": created, "errors": errors}


@router.get("/export/csv")
def export_citizens_csv(
    ward_id: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Citizen)
    if ward_id:
        q = q.filter(Citizen.ward_id == ward_id)
    citizens = q.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["citizen_code", "name", "mobile_number", "address", "age", "occupation", "annual_income", "category"])
    for c in citizens:
        writer.writerow([c.citizen_code, c.name, c.mobile_number, c.address, c.age, c.occupation, c.annual_income, c.category])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=citizens_export.csv"},
    )


@router.post("/families", response_model=FamilyOut, status_code=201)
def create_family(
    payload: FamilyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin", "data_entry_operator")),
):
    family = Family(**payload.model_dump())
    db.add(family)
    db.commit()
    db.refresh(family)
    return family


@router.get("/families/list", response_model=list[FamilyOut])
def list_families(ward_id: str | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Family)
    if ward_id:
        q = q.filter(Family.ward_id == ward_id)
    return q.all()
