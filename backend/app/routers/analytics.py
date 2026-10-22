from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.core_models import User
from app.models.citizen_models import Citizen
from app.models.geo_models import Ward
from app.models.complaint_models import Complaint, ComplaintStatus, ComplaintCategory
from app.models.campaign_models import CallLog, CallStatus, Campaign
from app.models.system_models import AIInsight, InsightSeverity
from app.schemas.system_schemas import DashboardSummary, InsightOut
from app.core.security import get_current_user
from app.services.ai_service import generate_insight_narrative

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard_summary(
    panchayat_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    ward_ids = [w.id for w in db.query(Ward.id).filter(Ward.panchayat_id == panchayat_id).all()]

    total_citizens = db.query(func.count(Citizen.id)).filter(Citizen.ward_id.in_(ward_ids)).scalar() or 0
    total_wards = len(ward_ids)

    calls_q = (
        db.query(CallLog)
        .join(Campaign, CallLog.campaign_id == Campaign.id)
        .filter(Campaign.panchayat_id == panchayat_id)
    )
    total_calls = calls_q.count()
    successful_calls = calls_q.filter(CallLog.status == CallStatus.COMPLETED).count()
    call_completion_rate = round((successful_calls / total_calls) * 100, 1) if total_calls else 0.0

    complaints_q = db.query(Complaint).filter(Complaint.ward_id.in_(ward_ids))
    total_complaints = complaints_q.count()
    open_complaints = complaints_q.filter(Complaint.status != ComplaintStatus.CLOSED).count()
    resolved_complaints = complaints_q.filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
    ).count()

    scores = [
        int(c.citizen_satisfaction_score)
        for c in complaints_q.filter(Complaint.citizen_satisfaction_score.isnot(None)).all()
        if c.citizen_satisfaction_score and c.citizen_satisfaction_score.isdigit()
    ]
    satisfaction_avg = round(sum(scores) / len(scores), 2) if scores else None

    complaints_by_category = {}
    for category in ComplaintCategory:
        count = complaints_q.filter(Complaint.category == category).count()
        if count:
            complaints_by_category[category.value] = count

    complaints_by_ward = {}
    for w in db.query(Ward).filter(Ward.panchayat_id == panchayat_id).all():
        count = db.query(func.count(Complaint.id)).filter(Complaint.ward_id == w.id).scalar()
        if count:
            complaints_by_ward[w.name] = count

    sentiment_breakdown = {"positive": 0, "neutral": 0, "negative": 0}
    for call in calls_q.filter(CallLog.sentiment.isnot(None)).all():
        if call.sentiment in sentiment_breakdown:
            sentiment_breakdown[call.sentiment] += 1

    return DashboardSummary(
        total_citizens=total_citizens,
        total_wards=total_wards,
        total_calls=total_calls,
        successful_calls=successful_calls,
        call_completion_rate=call_completion_rate,
        total_complaints=total_complaints,
        open_complaints=open_complaints,
        resolved_complaints=resolved_complaints,
        citizen_satisfaction_avg=satisfaction_avg,
        complaints_by_category=complaints_by_category,
        complaints_by_ward=complaints_by_ward,
        sentiment_breakdown=sentiment_breakdown,
    )


@router.post("/insights/generate", response_model=list[InsightOut])
def generate_insights(
    panchayat_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Recomputes AI-written insights from current data (call periodically, e.g. daily)."""
    insights = []
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    ward_ids = [w.id for w in db.query(Ward.id).filter(Ward.panchayat_id == panchayat_id).all()]

    # 1. Category trend insight (this 30 days vs previous 30 days)
    for category in ComplaintCategory:
        recent = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.ward_id.in_(ward_ids),
                Complaint.category == category,
                Complaint.created_at >= thirty_days_ago,
            )
            .scalar()
            or 0
        )
        previous = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.ward_id.in_(ward_ids),
                Complaint.category == category,
                Complaint.created_at >= sixty_days_ago,
                Complaint.created_at < thirty_days_ago,
            )
            .scalar()
            or 0
        )
        if previous > 0 and recent > previous:
            growth_pct = round(((recent - previous) / previous) * 100)
            stats = {
                "category": category.value,
                "recent_count": recent,
                "previous_count": previous,
                "growth_pct": growth_pct,
                "fallback_text": f"{category.value.title()} complaints increased by {growth_pct}% this month.",
            }
            headline = generate_insight_narrative(stats)
            severity = InsightSeverity.ALERT if growth_pct >= 50 else InsightSeverity.WATCH
            insight = AIInsight(
                panchayat_id=panchayat_id,
                headline=headline,
                detail=f"{recent} complaints in the last 30 days vs {previous} in the prior 30 days.",
                severity=severity,
                metric_key=f"{category.value}_complaints_growth",
            )
            db.add(insight)
            insights.append(insight)

    # 2. Ward hotspot insight
    ward_counts = {}
    for w in db.query(Ward).filter(Ward.panchayat_id == panchayat_id).all():
        count = db.query(func.count(Complaint.id)).filter(Complaint.ward_id == w.id).scalar() or 0
        ward_counts[w.name] = count
    if ward_counts:
        top_ward, top_count = max(ward_counts.items(), key=lambda kv: kv[1])
        if top_count > 0:
            stats = {
                "top_ward": top_ward,
                "count": top_count,
                "fallback_text": f"{top_ward} has the highest number of complaints ({top_count}).",
            }
            headline = generate_insight_narrative(stats)
            insight = AIInsight(
                panchayat_id=panchayat_id,
                headline=headline,
                detail=f"{top_ward} logged {top_count} total complaints.",
                severity=InsightSeverity.INFO,
                metric_key="ward_hotspot",
            )
            db.add(insight)
            insights.append(insight)

    db.commit()
    for i in insights:
        db.refresh(i)
    return insights


@router.get("/insights", response_model=list[InsightOut])
def list_insights(
    panchayat_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(AIInsight)
        .filter(AIInsight.panchayat_id == panchayat_id)
        .order_by(AIInsight.generated_at.desc())
        .limit(20)
        .all()
    )
