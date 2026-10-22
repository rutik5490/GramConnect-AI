import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class ComplaintCategory(str, enum.Enum):
    WATER = "water"
    ROADS = "roads"
    ELECTRICITY = "electricity"
    SANITATION = "sanitation"
    STREET_LIGHTS = "street_lights"
    HEALTH = "health"
    AGRICULTURE = "agriculture"
    CERTIFICATES = "certificates"
    OTHERS = "others"


class ComplaintPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplaintStatus(str, enum.Enum):
    REGISTERED = "registered"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FEEDBACK_PENDING = "feedback_pending"
    CLOSED = "closed"


class ComplaintSource(str, enum.Enum):
    AI_VOICE_CALL = "ai_voice_call"
    WEB = "web"
    MANUAL = "manual"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    complaint_code = Column(String(30), unique=True, nullable=False)
    citizen_id = Column(UUID(as_uuid=False), ForeignKey("citizens.id"), nullable=False)
    ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), default=ComplaintCategory.OTHERS)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.MEDIUM)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.REGISTERED)
    source = Column(Enum(ComplaintSource), default=ComplaintSource.MANUAL)
    assigned_to_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    citizen_feedback = Column(Text, nullable=True)
    citizen_satisfaction_score = Column(String(10), nullable=True)  # 1-5
    ai_classified = Column(String(5), default="false")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    citizen = relationship("Citizen", back_populates="complaints")
    ward = relationship("Ward")
    updates = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    complaint_id = Column(UUID(as_uuid=False), ForeignKey("complaints.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    old_status = Column(Enum(ComplaintStatus), nullable=True)
    new_status = Column(Enum(ComplaintStatus), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="updates")
