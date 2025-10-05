"""Report endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import csv
import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

from app.db import get_db
from app.models.report import Report
from app.models.user import User
from app.models.defect import Defect, DefectStatus, Priority
from app.models.project import Project
from app.core.deps import get_current_user, user_has_role_in_project
from app.schemas.report import ReportCreate, ReportResponse, ReportList, ReportFormat as SchemaReportFormat

router = APIRouter()

REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new report. Only supervisors can create reports."""
    project = db.query(Project).filter(Project.id == report_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    is_supervisor = user_has_role_in_project(current_user.id, report_data.project_id, ['supervisor'], db)
    
    if not is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only supervisors can create reports"
        )
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = 'xlsx' if report_data.format == SchemaReportFormat.EXCEL else 'csv'
        filename = f"report_{report_data.project_id}_{timestamp}.{file_extension}"
        file_path = os.path.join(REPORTS_DIR, filename)
        
        defects_data = db.query(
            Defect.id,
            Defect.title,
            Defect.description,
            Defect.location,
            DefectStatus.display_name.label('status'),
            Priority.display_name.label('priority'),
            User.first_name,
            User.last_name,
            Defect.due_date,
            Defect.created_at,
            Defect.updated_at
        ).join(
            DefectStatus, Defect.status_id == DefectStatus.id
        ).join(
            Priority, Defect.priority_id == Priority.id
        ).outerjoin(
            User, Defect.assignee_id == User.id
        ).filter(
            Defect.project_id == report_data.project_id
        ).all()
        
        if report_data.format == SchemaReportFormat.CSV:
            _generate_csv_report(file_path, defects_data)
        else:  # EXCEL
            _generate_excel_report(file_path, defects_data, project.name)
        
        file_size = os.path.getsize(file_path)
        
        db_report = Report(
            project_id=report_data.project_id,
            created_by=current_user.id,
            title=report_data.title,
            description=report_data.description,
            format=report_data.format.value,  
            file_path=file_path,
            file_size=file_size
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        creator_name = f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.username
        
        return {
            "id": db_report.id,
            "project_id": db_report.project_id,
            "created_by": db_report.created_by,
            "creator_name": creator_name,
            "title": db_report.title,
            "description": db_report.description,
            "format": db_report.format,
            "file_path": db_report.file_path,
            "file_size": db_report.file_size,
            "created_at": db_report.created_at
        }
        
    except Exception as e:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create report: {str(e)}"
        )


@router.get("/project/{project_id}", response_model=ReportList)
def get_project_reports(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    is_supervisor = user_has_role_in_project(current_user.id, project_id, ['supervisor'], db)
    is_manager = user_has_role_in_project(current_user.id, project_id, ['manager'], db)
    
    if not (is_supervisor or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only supervisors and managers can view reports"
        )
    
    reports = db.query(Report, User).join(
        User, Report.created_by == User.id
    ).filter(
        Report.project_id == project_id
    ).order_by(Report.created_at.desc()).all()
    
    result = []
    for report, creator in reports:
        creator_name = f"{creator.first_name} {creator.last_name}" if creator.first_name else creator.username
        result.append({
            "id": report.id,
            "project_id": report.project_id,
            "created_by": report.created_by,
            "creator_name": creator_name,
            "title": report.title,
            "description": report.description,
            "format": report.format,
            "file_path": report.file_path,
            "file_size": report.file_size,
            "created_at": report.created_at
        })
    
    return {
        "reports": result,
        "total": len(result)
    }


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    is_supervisor = user_has_role_in_project(current_user.id, report.project_id, ['supervisor'], db)
    is_manager = user_has_role_in_project(current_user.id, report.project_id, ['manager'], db)
    
    if not (is_supervisor or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only supervisors and managers can download reports"
        )
    
    if not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found"
        )
    
    filename = os.path.basename(report.file_path)
    media_type = "text/csv" if report.format == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    return FileResponse(
        path=report.file_path,
        filename=filename,
        media_type=media_type
    )


def _generate_csv_report(file_path: str, defects_data):
    with open(file_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)
        
        writer.writerow([
            'ID',
            'Название',
            'Описание',
            'Местоположение',
            'Статус',
            'Приоритет',
            'Исполнитель',
            'Срок выполнения',
            'Дата создания',
            'Дата обновления'
        ])
        
        for defect in defects_data:
            assignee = f"{defect.first_name} {defect.last_name}" if defect.first_name else "Не назначен"
            writer.writerow([
                defect.id,
                defect.title,
                defect.description,
                defect.location,
                defect.status,
                defect.priority,
                assignee,
                defect.due_date.strftime('%d.%m.%Y') if defect.due_date else '',
                defect.created_at.strftime('%d.%m.%Y %H:%M'),
                defect.updated_at.strftime('%d.%m.%Y %H:%M') if defect.updated_at else ''
            ])


def _generate_excel_report(file_path: str, defects_data, project_name: str):
    wb = Workbook()
    ws = wb.active
    ws.title = "Дефекты"
    
    ws.merge_cells('A1:J1')
    title_cell = ws['A1']
    title_cell.value = f"Отчет по дефектам: {project_name}"
    title_cell.font = Font(size=14, bold=True)
    title_cell.alignment = Alignment(horizontal='center')
    
    headers = [
        'ID', 'Название', 'Описание', 'Местоположение', 'Статус',
        'Приоритет', 'Исполнитель', 'Срок выполнения', 'Дата создания', 'Дата обновления'
    ]
    
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True)
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col_num)
        cell.value = header
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')
    
    for row_num, defect in enumerate(defects_data, 4):
        assignee = f"{defect.first_name} {defect.last_name}" if defect.first_name else "Не назначен"
        
        ws.cell(row=row_num, column=1, value=defect.id)
        ws.cell(row=row_num, column=2, value=defect.title)
        ws.cell(row=row_num, column=3, value=defect.description)
        ws.cell(row=row_num, column=4, value=defect.location)
        ws.cell(row=row_num, column=5, value=defect.status)
        ws.cell(row=row_num, column=6, value=defect.priority)
        ws.cell(row=row_num, column=7, value=assignee)
        ws.cell(row=row_num, column=8, value=defect.due_date.strftime('%d.%m.%Y') if defect.due_date else '')
        ws.cell(row=row_num, column=9, value=defect.created_at.strftime('%d.%m.%Y %H:%M'))
        ws.cell(row=row_num, column=10, value=defect.updated_at.strftime('%d.%m.%Y %H:%M') if defect.updated_at else '')
    
    for col_num in range(1, len(headers) + 1):
        max_length = 0
        column_letter = ws.cell(row=3, column=col_num).column_letter
        
        header_length = len(str(headers[col_num - 1]))
        if header_length > max_length:
            max_length = header_length
        
        for row_num in range(4, ws.max_row + 1):
            cell = ws.cell(row=row_num, column=col_num)
            try:
                if cell.value:
                    cell_length = len(str(cell.value))
                    if cell_length > max_length:
                        max_length = cell_length
            except:
                pass
        
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    wb.save(file_path)
