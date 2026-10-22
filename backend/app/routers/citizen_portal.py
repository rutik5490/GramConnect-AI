import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.geo_models import Panchayat, Ward
from app.models.citizen_models import Citizen
from app.models.complaint_models import Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, ComplaintSource
from app.models.content_models import Announcement, GovernmentScheme
from app.models.campaign_models import VoiceSession
from app.schemas.citizen_portal_schemas import (
    RequestOtpPayload,
    RequestOtpResponse,
    SelfRegisterPayload,
    VerifyOtpPayload,
    CitizenAuthToken,
    CitizenProfileOut,
    MyComplaintOut,
    MyComplaintCreate,
    PublicWardOut,
    PublicPanchayatOut,
)
from app.schemas.content_schemas import SchemeOut, AnnouncementOut
from app.schemas.campaign_schemas import VoiceTurnRequest, VoiceTurnResponse
from app.core.security import create_citizen_token, get_current_citizen
from app.services.otp_service import generate_and_send_otp, verify_otp
from app.services.scheme_service import find_eligible_schemes
from app.services.ai_service import classify_complaint, voice_assistant_reply
from app.routers.citizens import _generate_citizen_code
from app.routers.complaints import _generate_complaint_code

router = APIRouter(prefix="/api/citizen", tags=["Citizen Mobile App"])


# ---------- Public lookups (no auth — needed before login) ----------

@router.get("/panchayats", response_model=list[PublicPanchayatOut])
def public_panchayats(db: Session = Depends(get_db)):
    return db.query(Panchayat).all()


@router.get("/wards", response_model=list[PublicWardOut])
def public_wards(panchayat_id: str, db: Session = Depends(get_db)):
    return db.query(Ward).filter(Ward.panchayat_id == panchayat_id).order_by(Ward.ward_number).all()


# ---------- OTP authentication ----------

@router.post("/auth/request-otp", response_model=RequestOtpResponse)
def request_otp(payload: RequestOtpPayload, db: Session = Depends(get_db)):
    citizen = db.query(Citizen).filter(Citizen.mobile_number == payload.mobile_number).first()
    if not citizen:
        return RequestOtpResponse(
            citizen_exists=False,
            message="No citizen record found for this number. Please complete registration first.",
        )
    generate_and_send_otp(payload.mobile_number)
    return RequestOtpResponse(citizen_exists=True, message="OTP sent.")


@router.post("/auth/self-register", response_model=RequestOtpResponse)
def self_register(payload: SelfRegisterPayload, db: Session = Depends(get_db)):
    existing = db.query(Citizen).filter(Citizen.mobile_number == payload.mobile_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="This mobile number is already registered. Please log in instead.")
    ward = db.query(Ward).filter(Ward.id == payload.ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    citizen = Citizen(
        citizen_code=_generate_citizen_code(),
        name=payload.name,
        mobile_number=payload.mobile_number,
        ward_id=payload.ward_id,
        age=payload.age,
        gender=payload.gender,
        preferred_language=payload.preferred_language,
    )
    db.add(citizen)
    db.commit()

    generate_and_send_otp(payload.mobile_number)
    return RequestOtpResponse(citizen_exists=True, message="Registered. OTP sent.")


@router.post("/auth/verify-otp", response_model=CitizenAuthToken)
def verify_otp_and_login(payload: VerifyOtpPayload, db: Session = Depends(get_db)):
    if not verify_otp(payload.mobile_number, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    citizen = db.query(Citizen).filter(Citizen.mobile_number == payload.mobile_number).first()
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    token = create_citizen_token(citizen.id, citizen.mobile_number)
    return CitizenAuthToken(access_token=token, citizen=citizen)


# ---------- Authenticated citizen self-service endpoints ----------

@router.get("/me", response_model=CitizenProfileOut)
def my_profile(citizen: Citizen = Depends(get_current_citizen)):
    return citizen


@router.get("/complaints", response_model=list[MyComplaintOut])
def my_complaints(citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)):
    return (
        db.query(Complaint)
        .filter(Complaint.citizen_id == citizen.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


@router.post("/complaints", response_model=MyComplaintOut, status_code=201)
def file_my_complaint(
    payload: MyComplaintCreate,
    citizen: Citizen = Depends(get_current_citizen),
    db: Session = Depends(get_db),
):
    classification = classify_complaint(payload.description)
    complaint = Complaint(
        complaint_code=_generate_complaint_code(),
        citizen_id=citizen.id,
        ward_id=citizen.ward_id,
        description=payload.description,
        category=ComplaintCategory(classification.get("category", "others")),
        priority=ComplaintPriority(classification.get("priority", "medium")),
        source=ComplaintSource.WEB,
        ai_classified="true",
        status=ComplaintStatus.REGISTERED,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/announcements", response_model=list[AnnouncementOut])
def my_announcements(citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == citizen.ward_id).first()
    if not ward:
        return []
    return (
        db.query(Announcement)
        .filter(Announcement.panchayat_id == ward.panchayat_id)
        .order_by(Announcement.published_at.desc())
        .limit(50)
        .all()
    )


@router.get("/schemes/eligible", response_model=list[SchemeOut])
def my_eligible_schemes(citizen: Citizen = Depends(get_current_citizen), db: Session = Depends(get_db)):
    all_schemes = db.query(GovernmentScheme).all()
    return find_eligible_schemes(citizen, all_schemes)


@router.post("/voice-assistant/turn", response_model=VoiceTurnResponse)
def my_voice_turn(
    payload: VoiceTurnRequest,
    citizen: Citizen = Depends(get_current_citizen),
    db: Session = Depends(get_db),
):
    """Same AI assistant as the inbound IVR line, but launched from inside the app
    and automatically tied to the logged-in citizen's profile."""
    if payload.session_id:
        session = db.query(VoiceSession).filter(
            VoiceSession.id == payload.session_id, VoiceSession.citizen_id == citizen.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Voice session not found")
    else:
        session = VoiceSession(
            citizen_id=citizen.id,
            caller_mobile=citizen.mobile_number,
            language=payload.language,
            transcript_json="[]",
        )
        db.add(session)
        db.flush()

    history = json.loads(session.transcript_json)
    history.append({"role": "citizen", "text": payload.citizen_text})

    citizen_context = {
        "name": citizen.name,
        "ward_id": citizen.ward_id,
        "age": citizen.age,
        "occupation": citizen.occupation,
    }
    ai_result = voice_assistant_reply(history, citizen_context, language=session.language)
    history.append({"role": "assistant", "text": ai_result["reply"]})

    complaint_registered = False
    complaint_id = None
    if ai_result.get("intent") == "register_complaint" and ai_result.get("complaint_description"):
        classification = classify_complaint(ai_result["complaint_description"])
        complaint = Complaint(
            complaint_code=_generate_complaint_code(),
            citizen_id=citizen.id,
            ward_id=citizen.ward_id,
            description=ai_result["complaint_description"],
            category=ComplaintCategory(classification.get("category", "others")),
            priority=ComplaintPriority(classification.get("priority", "medium")),
            source=ComplaintSource.AI_VOICE_CALL,
            ai_classified="true",
            status=ComplaintStatus.REGISTERED,
        )
        db.add(complaint)
        db.flush()
        complaint_registered = True
        complaint_id = complaint.id
        session.resulting_complaint_id = complaint.id

    session.transcript_json = json.dumps(history, ensure_ascii=False)
    db.commit()
    db.refresh(session)

    return VoiceTurnResponse(
        session_id=session.id,
        reply=ai_result["reply"],
        intent=ai_result.get("intent", "general_query"),
        complaint_registered=complaint_registered,
        complaint_id=complaint_id,
    )
