import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class AnnouncementChannel(str, enum.Enum):
    AI_VOICE_CALL = "ai_voice_call"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    APP = "app"


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    channel = Column(Enum(AnnouncementChannel), default=AnnouncementChannel.APP)
    target_ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    created_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    name_marathi = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    department = Column(String(150), nullable=True)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    max_annual_income = Column(Integer, nullable=True)
    eligible_categories = Column(String(200), nullable=True)  # comma separated
    eligible_occupations = Column(String(300), nullable=True)  # comma separated
    application_link = Column(String(300), nullable=True)


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    campaign_id = Column(UUID(as_uuid=False), ForeignKey("campaigns.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    question_id = Column(UUID(as_uuid=False), ForeignKey("survey_questions.id"), nullable=False)
    citizen_id = Column(UUID(as_uuid=False), ForeignKey("citizens.id"), nullable=False)
    answer_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
