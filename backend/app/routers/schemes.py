from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.content_models import GovernmentScheme
from app.models.citizen_models import Citizen
from app.schemas.content_schemas import SchemeCreate, SchemeOut
from app.core.security import get_current_user, require_roles
from app.services.scheme_service import find_eligible_schemes

router = APIRouter(prefix="/api/schemes", tags=["Government Schemes"])


@router.post("", response_model=SchemeOut, status_code=201)
def create_scheme(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    scheme = GovernmentScheme(**payload.model_dump())
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.get("", response_model=list[SchemeOut])
def list_schemes(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(GovernmentScheme).all()


@router.get("/eligible/{citizen_id}", response_model=list[SchemeOut])
def eligible_schemes_for_citizen(citizen_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    all_schemes = db.query(GovernmentScheme).all()
    return find_eligible_schemes(citizen, all_schemes)
