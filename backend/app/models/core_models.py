import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    PANCHAYAT_ADMIN = "panchayat_admin"
    GRAM_SEVAK = "gram_sevak"
    SARPANCH = "sarpanch"
    DATA_ENTRY_OPERATOR = "data_entry_operator"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    mobile_number = Column(String(15), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.DATA_ENTRY_OPERATOR)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=True)
    ward_id = Column(UUID(as_uuid=False), ForeignKey("wards.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    panchayat = relationship("Panchayat", back_populates="users")
    ward = relationship("Ward", back_populates="users", foreign_keys=[ward_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    action = Column(String(150), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
