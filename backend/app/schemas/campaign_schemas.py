from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.campaign_models import CampaignType, CampaignStatus, CallStatus


class CampaignCreate(BaseModel):
    panchayat_id: str
    title: str
    campaign_type: CampaignType = CampaignType.OTHER
    message_script: str
    target_ward_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class CampaignOut(BaseModel):
    id: str
    panchayat_id: str
    title: str
    campaign_type: CampaignType
    message_script: str
    target_ward_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: CampaignStatus
    created_at: datetime

    class Config:
        from_attributes = True


class CallLogOut(BaseModel):
    id: str
    campaign_id: str
    citizen_id: str
    status: CallStatus
    duration_seconds: int
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    called_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VoiceTurnRequest(BaseModel):
    session_id: Optional[str] = None
    citizen_id: Optional[str] = None
    caller_mobile: Optional[str] = None
    language: str = "mr"
    citizen_text: str


class VoiceTurnResponse(BaseModel):
    session_id: str
    reply: str
    intent: str
    complaint_registered: bool = False
    complaint_id: Optional[str] = None
