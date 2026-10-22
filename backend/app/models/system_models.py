import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.core_models import gen_uuid


class InsightSeverity(str, enum.Enum):
    INFO = "info"
    WATCH = "watch"
    ALERT = "alert"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=False)
    headline = Column(String(300), nullable=False)
    detail = Column(Text, nullable=True)
    severity = Column(Enum(InsightSeverity), default=InsightSeverity.INFO)
    metric_key = Column(String(100), nullable=True)  # e.g. "water_complaints_growth"
    generated_at = Column(DateTime, default=datetime.utcnow)


class NotificationType(str, enum.Enum):
    HIGH_PRIORITY_COMPLAINT = "high_priority_complaint"
    CAMPAIGN_FINISHED = "campaign_finished"
    REPORT_READY = "report_ready"
    COMPLAINT_OVERDUE = "complaint_overdue"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    message = Column(String(400), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReportFormat(str, enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    panchayat_id = Column(UUID(as_uuid=False), ForeignKey("panchayats.id"), nullable=False)
    report_type = Column(String(100), nullable=False)
    format = Column(Enum(ReportFormat), default=ReportFormat.PDF)
    file_path = Column(String(400), nullable=False)
    generated_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
