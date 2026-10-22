from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.system_models import InsightSeverity, NotificationType, ReportFormat


class InsightOut(BaseModel):
    id: str
    headline: str
    detail: Optional[str] = None
    severity: InsightSeverity
    metric_key: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReportRequest(BaseModel):
    panchayat_id: str
    report_type: str  # complaints | citizens | campaigns | wards
    format: ReportFormat = ReportFormat.PDF


class ReportOut(BaseModel):
    id: str
    report_type: str
    format: ReportFormat
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_citizens: int
    total_wards: int
    total_calls: int
    successful_calls: int
    call_completion_rate: float
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    citizen_satisfaction_avg: Optional[float] = None
    complaints_by_category: dict
    complaints_by_ward: dict
    sentiment_breakdown: dict
