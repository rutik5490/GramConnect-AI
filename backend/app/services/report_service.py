import csv
import io
import os
from datetime import datetime

from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

NAVY = colors.HexColor("#0B3D6B")
SAFFRON = colors.HexColor("#FF9933")
GREEN = colors.HexColor("#138808")


def _filepath(report_type: str, ext: str) -> str:
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fname = f"{report_type}_{ts}.{ext}"
    return os.path.join(REPORTS_DIR, fname)


def generate_pdf_report(title: str, panchayat_name: str, headers: list[str], rows: list[list], report_type: str) -> str:
    path = _filepath(report_type, "pdf")
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=20 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("GovTitle", parent=styles["Title"], textColor=NAVY, fontSize=18)
    sub_style = ParagraphStyle("GovSub", parent=styles["Normal"], textColor=colors.HexColor("#555555"))

    elements = [
        Paragraph(f"GramConnect AI &nbsp;|&nbsp; {panchayat_name}", sub_style),
        Spacer(1, 6),
        Paragraph(title, title_style),
        Paragraph(f"Generated: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", sub_style),
        Spacer(1, 14),
    ]

    table_data = [headers] + rows
    table = Table(table_data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F4F0")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    return path


def generate_excel_report(title: str, headers: list[str], rows: list[list], report_type: str) -> str:
    path = _filepath(report_type, "xlsx")
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]
    ws.append(headers)
    for row in rows:
        ws.append(row)
    wb.save(path)
    return path


def generate_csv_report(headers: list[str], rows: list[list], report_type: str) -> str:
    path = _filepath(report_type, "csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    return path
