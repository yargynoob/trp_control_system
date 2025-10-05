"""Defect endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import date, datetime

from app.db import get_db
from app.models.defect import Defect, DefectStatus, Priority
from app.models.change_log import ChangeLog
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.defect import (
    Defect as DefectSchema,
    DefectCreate,
    DefectUpdate,
    DefectList,
    DefectStatus as DefectStatusSchema,
    Priority as PrioritySchema
)

router = APIRouter()


@router.get("/statuses", response_model=List[DefectStatusSchema])
def get_defect_statuses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all defect statuses."""
    statuses = db.query(DefectStatus).order_by(DefectStatus.order_index).all()
    return statuses


@router.get("/priorities", response_model=List[PrioritySchema])
def get_priorities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all priorities."""
    priorities = db.query(Priority).order_by(Priority.urgency_level).all()
    return priorities


@router.get("/", response_model=List[DefectList])
def get_defects(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all defects with filters."""
    query = db.query(Defect)
    
    if project_id:
        query = query.filter(Defect.project_id == project_id)
    
    if status:
        status_obj = db.query(DefectStatus).filter(DefectStatus.name == status).first()
        if status_obj:
            query = query.filter(Defect.status_id == status_obj.id)
    
    if priority:
        priority_obj = db.query(Priority).filter(Priority.name == priority).first()
        if priority_obj:
            query = query.filter(Defect.priority_id == priority_obj.id)
    
    if search:
        query = query.filter(
            or_(
                Defect.title.ilike(f"%{search}%"),
                Defect.description.ilike(f"%{search}%")
            )
        )
    
    defects = query.order_by(Defect.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for defect in defects:
        defect_data = {
            "id": defect.id,
            "number": defect.number,
            "title": defect.title,
            "status": defect.status.name,
            "priority": defect.priority.name,
            "location": defect.location,
            "assignee_name": f"{defect.assignee.first_name} {defect.assignee.last_name}" if defect.assignee and defect.assignee.first_name else (defect.assignee.username if defect.assignee else None),
            "reporter_name": f"{defect.reporter.first_name} {defect.reporter.last_name}" if defect.reporter.first_name else defect.reporter.username,
            "created_at": defect.created_at,
            "due_date": defect.due_date
        }
        result.append(DefectList(**defect_data))
    
    return result


@router.get("/{defect_id}", response_model=DefectSchema)
def get_defect(
    defect_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get defect by ID."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    return defect


@router.post("/", response_model=DefectSchema, status_code=status.HTTP_201_CREATED)
def create_defect(
    defect_in: DefectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new defect."""
    try:
        year = datetime.now().year
        count = db.query(func.count(Defect.id)).scalar() + 1
        defect_number = f"DEF-{year}-{count:04d}"
        
        if not defect_in.status_id:
            default_status = db.query(DefectStatus).filter(DefectStatus.is_initial == True).first()
            if not default_status:
                default_status = db.query(DefectStatus).filter(DefectStatus.name == "new").first()
            defect_in.status_id = default_status.id if default_status else 1
        
        defect_data = defect_in.model_dump()
        defect_data["number"] = defect_number
        
        db_defect = Defect(**defect_data)
        db.add(db_defect)
        db.flush()
        
        change_log = ChangeLog(
            defect_id=db_defect.id,
            user_id=defect_in.reporter_id,
            field_name="defect",
            new_value=defect_number,
            change_type="create"
        )
        db.add(change_log)
        
        db.commit()
        db.refresh(db_defect)
        
        return db_defect
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create defect: {str(e)}"
        )


@router.put("/{defect_id}", response_model=DefectSchema)
def update_defect(
    defect_id: int,
    defect_in: DefectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    try:
        update_data = defect_in.model_dump(exclude_unset=True)
        
        current_user_id = current_user.id
        
        for field, new_value in update_data.items():
            old_value = getattr(defect, field)
            
            if old_value != new_value:
                change_log = ChangeLog(
                    defect_id=defect_id,
                    user_id=current_user_id,
                    field_name=field,
                    old_value=str(old_value) if old_value is not None else None,
                    new_value=str(new_value) if new_value is not None else None,
                    change_type="status_change" if field == "status_id" else "update"
                )
                db.add(change_log)
            
            setattr(defect, field, new_value)
        
        if "status_id" in update_data:
            new_status = db.query(DefectStatus).filter(DefectStatus.id == update_data["status_id"]).first()
            if new_status and new_status.is_final:
                defect.closed_at = datetime.now()
        
        db.commit()
        db.refresh(defect)
        
        return defect
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update defect: {str(e)}"
        )


@router.delete("/{defect_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_defect(
    defect_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    db.delete(defect)
    db.commit()
    
    return None


@router.post("/update-overdue", status_code=status.HTTP_200_OK)
def update_overdue_defects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update overdue defects to critical priority."""
    try:
        critical_priority = db.query(Priority).filter(Priority.name == "critical").first()
        if not critical_priority:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Critical priority not found"
            )
        
        overdue_defects = db.query(Defect).join(DefectStatus).filter(
            Defect.due_date < date.today(),
            DefectStatus.is_final == False,
            Defect.priority_id != critical_priority.id
        ).all()
        
        updated_count = 0
        current_user_id = current_user.id  
        
        for defect in overdue_defects:
            old_priority_id = defect.priority_id
            defect.priority_id = critical_priority.id
            
            change_log = ChangeLog(
                defect_id=defect.id,
                user_id=current_user_id,
                field_name="priority_id",
                old_value=str(old_priority_id),
                new_value=str(critical_priority.id),
                change_type="update"
            )
            db.add(change_log)
            
            updated_count += 1
        
        db.commit()
        
        return {"updated": updated_count}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update overdue defects: {str(e)}"
        )
