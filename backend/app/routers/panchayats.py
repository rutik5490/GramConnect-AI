from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.core_models import User
from app.models.geo_models import Panchayat, Ward
from app.models.citizen_models import Citizen
from app.models.complaint_models import Complaint, ComplaintStatus
from app.schemas.geo_schemas import (
    PanchayatCreate,
    PanchayatOut,
    WardCreate,
    WardUpdate,
    WardOut,
    WardStats,
)
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/api", tags=["Panchayats & Wards"])


@router.post("/panchayats", response_model=PanchayatOut)
def create_panchayat(
    payload: PanchayatCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin")),
):
    panchayat = Panchayat(**payload.model_dump())
    db.add(panchayat)
    db.commit()
    db.refresh(panchayat)
    return panchayat


@router.get("/panchayats", response_model=list[PanchayatOut])
def list_panchayats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Panchayat).all()


@router.post("/wards", response_model=WardOut)
def create_ward(
    payload: WardCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    ward = Ward(**payload.model_dump())
    db.add(ward)
    db.commit()
    db.refresh(ward)
    return ward


@router.get("/wards", response_model=list[WardOut])
def list_wards(
    panchayat_id: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Ward)
    if panchayat_id:
        q = q.filter(Ward.panchayat_id == panchayat_id)
    return q.order_by(Ward.ward_number).all()


@router.patch("/wards/{ward_id}", response_model=WardOut)
def update_ward(
    ward_id: str,
    payload: WardUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ward, field, value)
    db.commit()
    db.refresh(ward)
    return ward


@router.delete("/wards/{ward_id}")
def delete_ward(
    ward_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    db.delete(ward)
    db.commit()
    return {"message": "Ward deleted"}


@router.get("/wards/stats", response_model=list[WardStats])
def ward_stats(
    panchayat_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wards = db.query(Ward).filter(Ward.panchayat_id == panchayat_id).order_by(Ward.ward_number).all()
    results = []
    for w in wards:
        total_citizens = db.query(func.count(Citizen.id)).filter(Citizen.ward_id == w.id).scalar()
        total_complaints = db.query(func.count(Complaint.id)).filter(Complaint.ward_id == w.id).scalar()
        open_complaints = (
            db.query(func.count(Complaint.id))
            .filter(Complaint.ward_id == w.id, Complaint.status != ComplaintStatus.CLOSED)
            .scalar()
        )
        results.append(
            WardStats(
                ward_id=w.id,
                ward_name=w.name,
                ward_number=w.ward_number,
                total_citizens=total_citizens or 0,
                total_complaints=total_complaints or 0,
                open_complaints=open_complaints or 0,
            )
        )
    return results
