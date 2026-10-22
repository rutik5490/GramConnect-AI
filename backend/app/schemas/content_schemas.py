from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.content_models import AnnouncementChannel


class AnnouncementCreate(BaseModel):
    panchayat_id: str
    title: str
    body: str
    channel: AnnouncementChannel = AnnouncementChannel.APP
    target_ward_id: Optional[str] = None


class AnnouncementOut(AnnouncementCreate):
    id: str
    published_at: datetime

    class Config:
        from_attributes = True


class SchemeCreate(BaseModel):
    name: str
    name_marathi: Optional[str] = None
    description: str
    department: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    max_annual_income: Optional[int] = None
    eligible_categories: Optional[str] = None
    eligible_occupations: Optional[str] = None
    application_link: Optional[str] = None


class SchemeOut(SchemeCreate):
    id: str

    class Config:
        from_attributes = True


class SchemeEligibilityCheck(BaseModel):
    citizen_id: str
