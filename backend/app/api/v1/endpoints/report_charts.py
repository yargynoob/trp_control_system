"""Report chart data endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.db import get_db
from app.models.user import User
from app.models.defect import Defect
from app.models.project import Project
from app.core.deps import get_current_user, user_has_role_in_project

router = APIRouter()


@router.get("/{report_id}/chart-data")
def get_report_chart_data(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chart data for a report (defects created in the last 30 days)."""
    from app.models.report import Report

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    project_ids = report.project_ids if report.project_ids else [report.project_id]
    
    for proj_id in project_ids:
        is_supervisor = user_has_role_in_project(current_user.id, proj_id, ['supervisor'], db)
        is_manager = user_has_role_in_project(current_user.id, proj_id, ['manager'], db)
        
        if not (is_supervisor or is_manager):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to report projects"
            )
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    all_dates = []
    current = start_date.date()
    while current <= end_date.date():
        all_dates.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    result = {}
    
    for proj_id in project_ids:
        project = db.query(Project).filter(Project.id == proj_id).first()
        project_name = project.name if project else f"Project {proj_id}"
        
        defects_by_day = db.query(
            func.date(Defect.created_at).label('date'),
            func.count(Defect.id).label('count')
        ).filter(
            and_(
                Defect.project_id == proj_id,
                Defect.created_at >= start_date,
                Defect.created_at <= end_date
            )
        ).group_by(
            func.date(Defect.created_at)
        ).all()
        
        defects_dict = {item.date.strftime('%Y-%m-%d'): item.count for item in defects_by_day}
        
        data = [defects_dict.get(date, 0) for date in all_dates]
        
        result[proj_id] = {
            "project_id": proj_id,
            "project_name": project_name,
            "data": data
        }
    
    return {
        "dates": all_dates,
        "projects": list(result.values())
    }
