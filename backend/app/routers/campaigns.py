import json
import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.campaign_models import Campaign, CallLog, ConversationTranscript, CallStatus, CampaignStatus
from app.models.citizen_models import Citizen
from app.models.system_models import Notification, NotificationType
from app.schemas.campaign_schemas import CampaignCreate, CampaignOut, CallLogOut
from app.core.security import get_current_user, require_roles
from app.services.ai_service import generate_campaign_call_summary

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

# Simulated citizen responses used when no real telephony provider is wired in.
# This lets admins demo/pilot the whole workflow end-to-end before connecting Exotel/Twilio.
_SIMULATED_REPLIES = [
    "हो, समजलं. धन्यवाद.",
    "आम्हाला पाणी अजून मिळालेलं नाही, कृपया लवकर पाठवा.",
    "ठीक आहे, मी सभेला येईन.",
    "मला याबद्दल अधिक माहिती हवी आहे.",
    "धन्यवाद, ही माहिती उपयुक्त आहे.",
]


@router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    campaign = Campaign(
        **payload.model_dump(),
        status=CampaignStatus.SCHEDULED if payload.scheduled_at else CampaignStatus.DRAFT,
        created_by_id=current_user.id,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("", response_model=list[CampaignOut])
def list_campaigns(
    panchayat_id: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Campaign)
    if panchayat_id:
        q = q.filter(Campaign.panchayat_id == panchayat_id)
    return q.order_by(Campaign.created_at.desc()).all()


@router.post("/{campaign_id}/run", response_model=list[CallLogOut])
def run_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "panchayat_admin")),
):
    """
    Launches the campaign: queues a call per target citizen, then simulates each
    call being placed and answered (or wire this endpoint to Exotel/Twilio webhooks
    for real outbound calling once telephony credentials are configured).
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    q = db.query(Citizen)
    if campaign.target_ward_id:
        q = q.filter(Citizen.ward_id == campaign.target_ward_id)
    citizens = q.all()
    if not citizens:
        raise HTTPException(status_code=400, detail="No citizens found for this campaign's target ward")

    campaign.status = CampaignStatus.RUNNING
    db.commit()

    call_logs = []
    for citizen in citizens:
        answered = random.random() > 0.15
        call_log = CallLog(
            campaign_id=campaign.id,
            citizen_id=citizen.id,
            status=CallStatus.COMPLETED if answered else CallStatus.NO_ANSWER,
            duration_seconds=random.randint(15, 90) if answered else 0,
            called_at=datetime.utcnow(),
        )
        if answered:
            simulated_reply = random.choice(_SIMULATED_REPLIES)
            ai_result = generate_campaign_call_summary(campaign.message_script, simulated_reply)
            call_log.ai_summary = ai_result.get("summary")
            call_log.sentiment = ai_result.get("sentiment")
            db.add(call_log)
            db.flush()
            transcript = [
                {"role": "assistant", "text": campaign.message_script},
                {"role": "citizen", "text": simulated_reply},
            ]
            db.add(
                ConversationTranscript(
                    call_log_id=call_log.id,
                    transcript_json=json.dumps(transcript, ensure_ascii=False),
                )
            )
        else:
            db.add(call_log)
        call_logs.append(call_log)

    campaign.status = CampaignStatus.COMPLETED
    db.add(
        Notification(
            user_id=current_user.id,
            type=NotificationType.CAMPAIGN_FINISHED,
            message=f"Campaign '{campaign.title}' finished: {len(call_logs)} calls placed.",
        )
    )
    db.commit()
    for c in call_logs:
        db.refresh(c)
    return call_logs


@router.get("/{campaign_id}/calls", response_model=list[CallLogOut])
def campaign_calls(campaign_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(CallLog).filter(CallLog.campaign_id == campaign_id).all()
