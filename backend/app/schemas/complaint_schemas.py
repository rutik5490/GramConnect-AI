from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.complaint_models import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
    ComplaintSource,
)


class ComplaintCreate(BaseModel):
    citizen_id: str
    ward_id: str
    description: str
    category: Optional[ComplaintCategory] = None
    priority: Optional[ComplaintPriority] = None
    source: ComplaintSource = ComplaintSource.MANUAL


class ComplaintStatusUpdate(BaseModel):
    new_status: ComplaintStatus
    remarks: Optional[str] = None
    assigned_to_id: Optional[str] = None


class ComplaintFeedback(BaseModel):
    citizen_feedback: str
    citizen_satisfaction_score: str  # "1".."5"


class ComplaintOut(BaseModel):
    id: str
    complaint_code: str
    citizen_id: str
    ward_id: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    source: ComplaintSource
    assigned_to_id: Optional[str] = None
    citizen_feedback: Optional[str] = None
    citizen_satisfaction_score: Optional[str] = None
    ai_classified: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplaintUpdateOut(BaseModel):
    id: str
    old_status: Optional[ComplaintStatus] = None
    new_status: ComplaintStatus
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
