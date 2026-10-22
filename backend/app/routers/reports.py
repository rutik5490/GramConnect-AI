import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.models.geo_models import Panchayat, Ward
from app.models.citizen_models import Citizen
from app.models.complaint_models import Complaint
from app.models.campaign_models import Campaign
from app.models.system_models import Report, ReportFormat, Notification, NotificationType
from app.schemas.system_schemas import ReportRequest, ReportOut
from app.core.security import get_current_user, require_roles
from app.services.report_service import generate_pdf_report, generate_excel_report, generate_csv_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _build_dataset(db: Session, panchayat_id: str, report_type: str):
    if report_type == "complaints":
        rows_q = db.query(Complaint).join(Ward, Complaint.ward_id == Ward.id).filter(Ward.panchayat_id == panchayat_id)
        headers = ["Complaint Code", "Ward", "Category", "Priority", "Status", "Created At"]
        rows = [
            [c.complaint_code, c.ward.name if c.ward else "", c.category.value, c.priority.value, c.status.value, c.created_at.strftime("%Y-%m-%d")]
            for c in rows_q.all()
        ]
        title = "Complaint Report"
    elif report_type == "citizens":
        rows_q = db.query(Citizen).join(Ward, Citizen.ward_id == Ward.id).filter(Ward.panchayat_id == panchayat_id)
        headers = ["Citizen Code", "Name", "Mobile", "Ward", "Age", "Occupation"]
        rows = [
            [c.citizen_code, c.name, c.mobile_number, c.ward.name if c.ward else "", c.age or "", c.occupation or ""]
            for c in rows_q.all()
        ]
        title = "Citizen Report"
    elif report_type == "campaigns":
        rows_q = db.query(Campaign).filter(Campaign.panchayat_id == panchayat_id)
        headers = ["Title", "Type", "Status", "Scheduled At", "Created At"]
        rows = [
            [c.title, c.campaign_type.value, c.status.value, c.scheduled_at.strftime("%Y-%m-%d") if c.scheduled_at else "", c.created_at.strftime("%Y-%m-%d")]
            for c in rows_q.all()
        ]
        title = "Campaign Report"
    elif report_type == "wards":
        rows_q = db.query(Ward).filter(Ward.panchayat_id == panchayat_id)
        headers = ["Ward #", "Name", "Population", "Households"]
        rows = [[w.ward_number, w.name, w.population, w.households] for w in rows_q.all()]
        title = "Ward Report"
    else:
        raise HTTPException(status_code=400, detail="Unknown report_type")
    return title, headers, rows


@router.post("/generate", response_model=ReportOut)
def generate_report(
    payload: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("super_admin", "panchayat_admin", "sarpanch")),
):
    panchayat = db.query(Panchayat).filter(Panchayat.id == payload.panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    title, headers, rows = _build_dataset(db, payload.panchayat_id, payload.report_type)

    if payload.format == ReportFormat.PDF:
        path = generate_pdf_report(title, panchayat.name, headers, rows, payload.report_type)
    elif payload.format == ReportFormat.EXCEL:
        path = generate_excel_report(title, headers, rows, payload.report_type)
    else:
        path = generate_csv_report(headers, rows, payload.report_type)

    report = Report(
        panchayat_id=payload.panchayat_id,
        report_type=payload.report_type,
        format=payload.format,
        file_path=path,
        generated_by_id=current_user.id,
    )
    db.add(report)
    db.add(
        Notification(
            user_id=current_user.id,
            type=NotificationType.REPORT_READY,
            message=f"{title} ({payload.format.value.upper()}) is ready to download.",
        )
    )
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[ReportOut])
def list_reports(panchayat_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(Report)
        .filter(Report.panchayat_id == panchayat_id)
        .order_by(Report.created_at.desc())
        .all()
    )


@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    filename = os.path.basename(report.file_path)
    return FileResponse(report.file_path, filename=filename)
