from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.content_models import Announcement
from app.schemas.content_schemas import AnnouncementCreate, AnnouncementOut
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])


@router.post("", response_model=AnnouncementOut, status_code=201)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "panchayat_admin", "sarpanch")),
):
    announcement = Announcement(**payload.model_dump(), created_by_id=current_user.id)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.get("", response_model=list[AnnouncementOut])
def list_announcements(
    panchayat_id: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Announcement)
    if panchayat_id:
        q = q.filter(Announcement.panchayat_id == panchayat_id)
    return q.order_by(Announcement.published_at.desc()).all()
