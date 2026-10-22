from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.citizen_models import Gender, Language
from app.models.complaint_models import ComplaintCategory, ComplaintPriority, ComplaintStatus


class RequestOtpPayload(BaseModel):
    mobile_number: str


class RequestOtpResponse(BaseModel):
    citizen_exists: bool
    message: str


class SelfRegisterPayload(BaseModel):
    mobile_number: str
    name: str
    ward_id: str
    age: Optional[int] = None
    gender: Optional[Gender] = None
    preferred_language: Language = Language.MARATHI


class VerifyOtpPayload(BaseModel):
    mobile_number: str
    otp: str


class CitizenProfileOut(BaseModel):
    id: str
    citizen_code: str
    name: str
    mobile_number: str
    ward_id: str
    age: Optional[int] = None
    occupation: Optional[str] = None
    preferred_language: Language

    class Config:
        from_attributes = True


class CitizenAuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    citizen: CitizenProfileOut


class MyComplaintOut(BaseModel):
    id: str
    complaint_code: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MyComplaintCreate(BaseModel):
    description: str


class PublicWardOut(BaseModel):
    id: str
    name: str
    ward_number: int

    class Config:
        from_attributes = True


class PublicPanchayatOut(BaseModel):
    id: str
    name: str
    district: str
    state: str

    class Config:
        from_attributes = True
