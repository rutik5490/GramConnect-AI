import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.complaint_models import (
    Complaint,
    ComplaintUpdate,
    ComplaintStatus,
    ComplaintCategory,
    ComplaintPriority,
)
from app.models.system_models import Notification, NotificationType
from app.schemas.complaint_schemas import (
    ComplaintCreate,
    ComplaintOut,
    ComplaintStatusUpdate,
    ComplaintFeedback,
    ComplaintUpdateOut,
)
from app.core.security import get_current_user, require_roles
from app.services.ai_service import classify_complaint

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


def _generate_complaint_code() -> str:
    return f"CMP-{uuid.uuid4().hex[:8].upper()}"


@router.post("", response_model=ComplaintOut, status_code=201)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = payload.category
    priority = payload.priority
    ai_classified = "false"

    if category is None or priority is None:
        result = classify_complaint(payload.description)
        category = category or ComplaintCategory(result.get("category", "others"))
        priority = priority or ComplaintPriority(result.get("priority", "medium"))
        ai_classified = "true"

    complaint = Complaint(
        complaint_code=_generate_complaint_code(),
        citizen_id=payload.citizen_id,
        ward_id=payload.ward_id,
        description=payload.description,
        category=category,
        priority=priority,
        source=payload.source,
        ai_classified=ai_classified,
        status=ComplaintStatus.REGISTERED,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    if priority in ("high", "critical"):
        admins = db.query(User).filter(User.role.in_(["panchayat_admin", "super_admin"])).all()
        for admin in admins:
            db.add(
                Notification(
                    user_id=admin.id,
                    type=NotificationType.HIGH_PRIORITY_COMPLAINT,
                    message=f"New {priority.value if hasattr(priority,'value') else priority} priority complaint {complaint.complaint_code} registered.",
                )
            )
        db.commit()

    return complaint


@router.get("", response_model=list[ComplaintOut])
def list_complaints(
    ward_id: str | None = None,
    status_filter: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Complaint)
    if ward_id:
        q = q.filter(Complaint.ward_id == ward_id)
    if status_filter:
        q = q.filter(Complaint.status == status_filter)
    if category:
        q = q.filter(Complaint.category == category)
    if priority:
        q = q.filter(Complaint.priority == priority)
    return q.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.get("/{complaint_id}/history", response_model=list[ComplaintUpdateOut])
def complaint_history(complaint_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(ComplaintUpdate)
        .filter(ComplaintUpdate.complaint_id == complaint_id)
        .order_by(ComplaintUpdate.created_at)
        .all()
    )


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
def update_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("super_admin", "panchayat_admin", "gram_sevak", "sarpanch")
    ),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = payload.new_status
    if payload.assigned_to_id:
        complaint.assigned_to_id = payload.assigned_to_id
    if payload.new_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = datetime.utcnow()
    complaint.updated_at = datetime.utcnow()

    db.add(
        ComplaintUpdate(
            complaint_id=complaint.id,
            updated_by_id=current_user.id,
            old_status=old_status,
            new_status=payload.new_status,
            remarks=payload.remarks,
        )
    )
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/{complaint_id}/feedback", response_model=ComplaintOut)
def submit_feedback(complaint_id: str, payload: ComplaintFeedback, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.citizen_feedback = payload.citizen_feedback
    complaint.citizen_satisfaction_score = payload.citizen_satisfaction_score
    complaint.status = ComplaintStatus.CLOSED
    db.commit()
    db.refresh(complaint)
    return complaint
