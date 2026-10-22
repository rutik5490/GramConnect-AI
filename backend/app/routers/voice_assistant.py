import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.campaign_models import VoiceSession
from app.models.citizen_models import Citizen
from app.models.complaint_models import (
    Complaint,
    ComplaintStatus,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintSource,
)
from app.schemas.campaign_schemas import VoiceTurnRequest, VoiceTurnResponse
from app.core.security import get_current_user
from app.services.ai_service import classify_complaint, voice_assistant_reply

router = APIRouter(prefix="/api/voice-assistant", tags=["AI Voice Assistant"])


def _generate_complaint_code() -> str:
    return f"CMP-{uuid.uuid4().hex[:8].upper()}"


@router.post("/turn", response_model=VoiceTurnResponse)
def voice_turn(payload: VoiceTurnRequest, db: Session = Depends(get_db)):
    """
    One turn of the inbound AI assistant conversation. Any citizen can call this
    (no auth) the same way they'd dial the Panchayat's AI phone line; a session_id
    threads the conversation together. When the AI detects a complaint, it is
    auto-registered and classified.
    """
    if payload.session_id:
        session = db.query(VoiceSession).filter(VoiceSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Voice session not found")
    else:
        citizen = None
        if payload.citizen_id:
            citizen = db.query(Citizen).filter(Citizen.id == payload.citizen_id).first()
        elif payload.caller_mobile:
            citizen = db.query(Citizen).filter(Citizen.mobile_number == payload.caller_mobile).first()
        session = VoiceSession(
            citizen_id=citizen.id if citizen else None,
            caller_mobile=payload.caller_mobile,
            language=payload.language,
            transcript_json="[]",
        )
        db.add(session)
        db.flush()

    history = json.loads(session.transcript_json)
    history.append({"role": "citizen", "text": payload.citizen_text})

    citizen_context = None
    if session.citizen_id:
        citizen = db.query(Citizen).filter(Citizen.id == session.citizen_id).first()
        if citizen:
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
        if session.citizen_id:
            citizen = db.query(Citizen).filter(Citizen.id == session.citizen_id).first()
            complaint = Complaint(
                complaint_code=_generate_complaint_code(),
                citizen_id=session.citizen_id,
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


@router.get("/sessions/{session_id}/transcript")
def get_transcript(session_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session.id, "transcript": json.loads(session.transcript_json)}
