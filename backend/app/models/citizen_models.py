import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Language(str, enum.Enum):
    MARATHI = "mr"
    HINDI = "hi"
    ENGLISH = "en"


class Family(Base):
    __tablename__ = "families"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    family_head_name = Column(String(150), nullable=False)
    ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=False)
    address = Column(String(300), nullable=True)
    ration_card_number = Column(String(50), nullable=True)

    members = relationship("Citizen", back_populates="family")


class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    citizen_code = Column(String(30), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    mobile_number = Column(String(15), nullable=False, index=True)
    address = Column(String(300), nullable=True)
    ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=False)
    family_id = Column(UUID(as_uuid=False), ForeignKey("families.id"), nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    age = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)  # e.g. General/OBC/SC/ST
    preferred_language = Column(Enum(Language), default=Language.MARATHI)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ward = relationship("Ward", back_populates="citizens")
    family = relationship("Family", back_populates="members")
    complaints = relationship("Complaint", back_populates="citizen")
