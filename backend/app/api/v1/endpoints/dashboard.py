"""Dashboard endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from datetime import date

from app.db import get_db
from app.models.defect import Defect, DefectStatus, Priority
from app.models.change_log import ChangeLog
from app.models.user import User
from app.models.project import Project
from app.core.deps import get_current_user

router = APIRouter()


@router.get("/{project_id}/metrics")
def get_project_metrics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project metrics."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    total_defects = db.query(func.count(Defect.id)).filter(
        Defect.project_id == project_id
    ).scalar()
    
    in_progress_count = db.query(func.count(Defect.id)).join(DefectStatus).filter(
        Defect.project_id == project_id,
        DefectStatus.name == 'in_progress'
    ).scalar()
    
    overdue_count = db.query(func.count(Defect.id)).join(DefectStatus).filter(
        Defect.project_id == project_id,
        Defect.due_date < date.today(),
        DefectStatus.is_final == False
    ).scalar()
    
    return {
        "totalDefects": total_defects or 0,
        "inProgress": in_progress_count or 0,
        "overdue": overdue_count or 0
    }


@router.get("/{project_id}/critical-defects")
def get_critical_defects(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get critical defects for project (limit 2)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    critical_priority = db.query(Priority).filter(Priority.name == 'critical').first()
    
    defects = db.query(
        Defect,
        User,
        Priority,
        DefectStatus,
        case(
            (and_(Defect.due_date.isnot(None), Defect.due_date < date.today()), 
             func.current_date() - Defect.due_date),
            else_=0
        ).label('overdue_days')
    ).outerjoin(
        User, Defect.assignee_id == User.id
    ).join(
        Priority, Defect.priority_id == Priority.id
    ).join(
        DefectStatus, Defect.status_id == DefectStatus.id
    ).filter(
        Defect.project_id == project_id,
        DefectStatus.name.in_(['new', 'in_progress']),
        or_(
            Defect.priority_id == critical_priority.id if critical_priority else False,
            Defect.due_date < date.today()
        )
    ).order_by(
        Priority.urgency_level.desc(),
        Defect.created_at.asc()
    ).limit(2).all()
    
    result = []
    for defect, user, priority, status, overdue_days in defects:
        assignee_name = "Не назначен"
        if user:
            assignee_name = f"{user.first_name} {user.last_name}" if user.first_name else user.username
        
        result.append({
            "id": f"DEF-{defect.id}",
            "title": defect.title,
            "location": defect.location or "Местоположение не указано",
            "assignee": assignee_name,
            "overdueDays": max(0, int(overdue_days) if overdue_days else 0)
        })
    
    return result


@router.get("/{project_id}/recent-actions")
def get_recent_actions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent actions for project (limit 3)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    change_logs = db.query(ChangeLog, User, Defect).join(
        User, ChangeLog.user_id == User.id
    ).join(
        Defect, ChangeLog.defect_id == Defect.id
    ).filter(
        Defect.project_id == project_id
    ).order_by(
        ChangeLog.created_at.desc()
    ).limit(3).all()
    
    result = []
    for log, user, defect in change_logs:
        user_name = f"{user.first_name} {user.last_name}" if user.first_name else user.username
        
        action = _format_action(log, db)
        
        result.append({
            "id": log.id,
            "time": log.created_at.strftime("%H:%M"),
            "user": user_name,
            "action": action
        })
    
    return result


@router.get("/{project_id}/all-actions")
def get_all_actions(
    project_id: int,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all actions for project (limit 100) with optional search."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    query = db.query(ChangeLog, User, Defect).join(
        User, ChangeLog.user_id == User.id
    ).join(
        Defect, ChangeLog.defect_id == Defect.id
    ).filter(
        Defect.project_id == project_id
    )
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                Defect.title.ilike(search_pattern),
                ChangeLog.field_name.ilike(search_pattern)
            )
        )
    
    change_logs = query.order_by(
        ChangeLog.created_at.desc()
    ).limit(100).all()
    
    result = []
    for log, user, defect in change_logs:
        user_name = f"{user.first_name} {user.last_name}" if user.first_name else user.username
        
        action = _format_action(log, db)
        
        result.append({
            "id": log.id,
            "time": log.created_at.strftime("%d.%m.%Y %H:%M"),
            "user": user_name,
            "action": action,
            "defectId": defect.id,
            "defectTitle": defect.title
        })
    
    return result


def _format_action(log: ChangeLog, db: Session) -> str:
    """Format action description based on change type."""
    if log.change_type == 'create':
        return "создал дефект"
    
    if log.change_type == 'delete':
        return "удалил дефект"
    
    if log.change_type == 'update':
        if log.field_name == 'description':
            return "обновил описание дефекта"
        elif log.field_name == 'attachment':
            return "добавил файл к дефекту"
        elif log.field_name == 'comment':
            return "добавил комментарий"
        elif log.field_name == 'status_id':
            old_status = db.query(DefectStatus).filter(DefectStatus.id == int(log.old_value)).first() if log.old_value else None
            new_status = db.query(DefectStatus).filter(DefectStatus.id == int(log.new_value)).first() if log.new_value else None
            
            old_name = _fix_status_name(old_status.display_name) if old_status else "Неизвестно"
            new_name = _fix_status_name(new_status.display_name) if new_status else "Неизвестно"
            
            return f'изменил статус с "{old_name}" на "{new_name}"'
        elif log.field_name == 'priority_id':
            old_priority = db.query(Priority).filter(Priority.id == int(log.old_value)).first() if log.old_value else None
            new_priority = db.query(Priority).filter(Priority.id == int(log.new_value)).first() if log.new_value else None
            
            old_name = old_priority.display_name if old_priority else "Неизвестно"
            new_name = new_priority.display_name if new_priority else "Неизвестно"
            
            return f'изменил приоритет с "{old_name}" на "{new_name}"'
        elif log.field_name == 'assignee_id':
            old_user = db.query(User).filter(User.id == int(log.old_value)).first() if log.old_value else None
            new_user = db.query(User).filter(User.id == int(log.new_value)).first() if log.new_value else None
            
            old_name = f"{old_user.first_name} {old_user.last_name}" if old_user and old_user.first_name else (old_user.username if old_user else "Не назначен")
            new_name = f"{new_user.first_name} {new_user.last_name}" if new_user and new_user.first_name else (new_user.username if new_user else "Не назначен")
            
            return f'изменил исполнителя с "{old_name}" на "{new_name}"'
        else:
            return f"изменил поле {log.field_name}"
    
    if log.change_type == 'status_change':
        old_status = db.query(DefectStatus).filter(DefectStatus.id == int(log.old_value)).first() if log.old_value else None
        new_status = db.query(DefectStatus).filter(DefectStatus.id == int(log.new_value)).first() if log.new_value else None
        
        old_name = _fix_status_name(old_status.display_name) if old_status else "Неизвестно"
        new_name = _fix_status_name(new_status.display_name) if new_status else "Неизвестно"
        
        return f'изменил статус с "{old_name}" на "{new_name}"'
    
    return "выполнил действие"


def _fix_status_name(display_name: str) -> str:
    """Fix status name to masculine form."""
    mapping = {
        "Новая": "Новый",
        "Закрыта": "Закрыт",
        "Отменена": "Отменен"
    }
    return mapping.get(display_name, display_name)


@router.get("/{project_id}/defects")
def get_project_defects(
    project_id: int,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get defects for project with search."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    query = db.query(Defect).filter(Defect.project_id == project_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Defect.title.ilike(search_pattern),
                Defect.description.ilike(search_pattern)
            )
        )
    
    defects = query.order_by(Defect.created_at.desc()).all()
    
    result = []
    for defect in defects:
        result.append({
            "id": defect.id,
            "title": defect.title,
            "description": defect.description,
            "status": defect.status.name,
            "statusDisplay": defect.status.display_name,
            "priority": defect.priority.name,
            "priorityDisplay": defect.priority.display_name,
            "assignee": f"{defect.assignee.first_name} {defect.assignee.last_name}" if defect.assignee and defect.assignee.first_name else (defect.assignee.username if defect.assignee else None),
            "reporter": f"{defect.reporter.first_name} {defect.reporter.last_name}" if defect.reporter.first_name else defect.reporter.username,
            "location": defect.location,
            "createdAt": defect.created_at.isoformat(),
            "updatedAt": defect.updated_at.isoformat(),
            "dueDate": defect.due_date.isoformat() if defect.due_date else None
        })
    
    return result
