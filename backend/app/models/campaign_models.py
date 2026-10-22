import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class CampaignType(str, enum.Enum):
    GRAM_SABHA_MEETING = "gram_sabha_meeting"
    WATER_SUPPLY_ALERT = "water_supply_alert"
    VACCINATION_DRIVE = "vaccination_drive"
    TAX_REMINDER = "tax_reminder"
    SURVEY = "survey"
    ELECTION_AWARENESS = "election_awareness"
    OTHER = "other"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=False)
    title = Column(String(200), nullable=False)
    campaign_type = Column(Enum(CampaignType), default=CampaignType.OTHER)
    message_script = Column(Text, nullable=False)
    target_ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    created_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    call_logs = relationship("CallLog", back_populates="campaign", cascade="all, delete-orphan")


class CallStatus(str, enum.Enum):
    QUEUED = "queued"
    CALLING = "calling"
    COMPLETED = "completed"
    NO_ANSWER = "no_answer"
    FAILED = "failed"


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    campaign_id = Column(UUID(as_uuid=False), ForeignKey("campaigns.id"), nullable=False)
    citizen_id = Column(UUID(as_uuid=False), ForeignKey("citizens.id"), nullable=False)
    status = Column(Enum(CallStatus), default=CallStatus.QUEUED)
    duration_seconds = Column(Integer, default=0)
    ai_summary = Column(Text, nullable=True)
    sentiment = Column(String(20), nullable=True)  # positive/neutral/negative
    called_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="call_logs")
    transcript = relationship("ConversationTranscript", back_populates="call_log", uselist=False, cascade="all, delete-orphan")


class ConversationTranscript(Base):
    __tablename__ = "conversation_transcripts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    call_log_id = Column(UUID(as_uuid=False), ForeignKey("call_logs.id"), nullable=False)
    transcript_json = Column(Text, nullable=False)  # JSON-encoded list of {role, text}
    created_at = Column(DateTime, default=datetime.utcnow)

    call_log = relationship("CallLog", back_populates="transcript")


class VoiceSession(Base):
    """A live/inbound citizen <-> AI assistant chat/voice session (text-based demo of the IVR)."""
    __tablename__ = "voice_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    citizen_id = Column(UUID(as_uuid=False), ForeignKey("citizens.id"), nullable=True)
    caller_mobile = Column(String(15), nullable=True)
    language = Column(String(5), default="mr")
    transcript_json = Column(Text, default="[]")
    resulting_complaint_id = Column(UUID(as_uuid=False), ForeignKey("complaints.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
