from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class Panchayat(Base):
    __tablename__ = "panchayats"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False, default="Maharashtra")
    pincode = Column(String(10), nullable=True)
    sarpanch_name = Column(String(150), nullable=True)
    contact_number = Column(String(15), nullable=True)
    subscription_plan = Column(String(50), default="pilot")
    created_at = Column(DateTime, default=datetime.utcnow)

    wards = relationship("Ward", back_populates="panchayat", cascade="all, delete-orphan")
    users = relationship("User", back_populates="panchayat")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=False)
    name = Column(String(100), nullable=False)
    ward_number = Column(Integer, nullable=False)
    population = Column(Integer, default=0)
    households = Column(Integer, default=0)
    assigned_gram_sevak_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    local_issues = Column(String(500), nullable=True)

    panchayat = relationship("Panchayat", back_populates="wards")
    users = relationship("User", back_populates="ward", foreign_keys="[User.ward_id]")
    citizens = relationship("Citizen", back_populates="ward")
