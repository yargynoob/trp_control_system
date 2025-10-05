"""Defect endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import date, datetime

from app.db import get_db
from app.models.defect import Defect, DefectStatus, Priority
from app.models.change_log import ChangeLog
from app.models.comment import Comment
from app.models.user import User
from app.core.deps import get_current_user, user_has_role_in_project, get_user_role_in_project
from app.schemas.defect import (
    Defect as DefectSchema,
    DefectCreate,
    DefectUpdate,
    DefectList,
    DefectStatus as DefectStatusSchema,
    Priority as PrioritySchema
)
from app.schemas.comment import CommentCreate, Comment as CommentSchema

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
            "assignee_id": defect.assignee_id,
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
    """Create new defect. Supervisors cannot create defects."""
    if not current_user.is_superuser:
        user_role = get_user_role_in_project(current_user.id, defect_in.project_id, db)
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        if user_role == 'supervisor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisors cannot create defects"
            )
    
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
    """Update defect. Supervisors cannot update defects."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    if not current_user.is_superuser:
        if user_has_role_in_project(current_user.id, defect.project_id, ['supervisor'], db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisors cannot edit defects"
            )
    
    current_status = db.query(DefectStatus).filter(DefectStatus.id == defect.status_id).first()
    if current_status and current_status.name == 'closed':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit closed defect"
        )
    
    try:
        update_data = defect_in.model_dump(exclude_unset=True)
        
        if 'status' in update_data and update_data['status']:
            status_name = update_data.pop('status')
            new_status = db.query(DefectStatus).filter(DefectStatus.name == status_name).first()
            if new_status:
                is_manager = user_has_role_in_project(current_user.id, defect.project_id, ['manager'], db)
                is_engineer = user_has_role_in_project(current_user.id, defect.project_id, ['engineer'], db)
                
                current_defect_status = db.query(DefectStatus).filter(DefectStatus.id == defect.status_id).first()
                
                if current_defect_status:
                    if current_defect_status.name == 'review' and not is_manager:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only managers can change status from 'review'"
                        )
                    
                    if current_defect_status.name in ['new', 'in_progress']:
                        if not (is_manager or is_engineer):
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Insufficient permissions to change status"
                            )
                
                update_data['status_id'] = new_status.id
        
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


@router.post("/{defect_id}/comments", response_model=CommentSchema, status_code=status.HTTP_201_CREATED)
def create_comment(
    defect_id: int,
    comment_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a comment on a defect. Only engineers and managers can comment."""
    content = comment_data.get("content", "").strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty"
        )
    
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    is_engineer = user_has_role_in_project(current_user.id, defect.project_id, ['engineer'], db)
    is_manager = user_has_role_in_project(current_user.id, defect.project_id, ['manager'], db)
    
    if not (is_engineer or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only engineers and managers can add comments"
        )
    
    if is_engineer and not is_manager:
        if defect.assignee_id and defect.assignee_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Engineers can only comment on their assigned defects"
            )
    
    try:
        comment = Comment(
            defect_id=defect_id,
            author_id=current_user.id,
            content=content
        )
        db.add(comment)
        
        change_log = ChangeLog(
            defect_id=defect_id,
            user_id=current_user.id,
            field_name='comment',
            old_value=None,
            new_value=content[:100] if len(content) > 100 else content,  # Truncate for log
            change_type='comment'
        )
        db.add(change_log)
        
        db.commit()
        db.refresh(comment)
        
        author_name = f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.username
        
        return {
            "id": comment.id,
            "defect_id": comment.defect_id,
            "author_id": comment.author_id,
            "author_name": author_name,
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )


@router.get("/{defect_id}/comments", response_model=List[CommentSchema])
def get_comments(
    defect_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all comments for a defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    is_engineer = user_has_role_in_project(current_user.id, defect.project_id, ['engineer'], db)
    is_manager = user_has_role_in_project(current_user.id, defect.project_id, ['manager'], db)
    is_supervisor = user_has_role_in_project(current_user.id, defect.project_id, ['supervisor'], db)
    
    if not (is_engineer or is_manager or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this defect"
        )
    
    if is_engineer and not (is_manager or is_supervisor):
        if defect.assignee_id and defect.assignee_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Engineers can only view comments on their assigned defects"
            )
    
    comments = db.query(Comment, User).join(
        User, Comment.author_id == User.id
    ).filter(
        Comment.defect_id == defect_id
    ).order_by(Comment.created_at.asc()).all()
    
    result = []
    for comment, author in comments:
        author_name = f"{author.first_name} {author.last_name}" if author.first_name else author.username
        result.append({
            "id": comment.id,
            "defect_id": comment.defect_id,
            "author_id": comment.author_id,
            "author_name": author_name,
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        })
    
    return result


@router.delete("/{defect_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    defect_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment. Managers can delete any comment, engineers can delete only their own."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.defect_id == defect_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    is_engineer = user_has_role_in_project(current_user.id, defect.project_id, ['engineer'], db)
    is_manager = user_has_role_in_project(current_user.id, defect.project_id, ['manager'], db)
    
    if not (is_engineer or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only engineers and managers can delete comments"
        )
    
    if is_engineer and not is_manager:
        if comment.author_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Engineers can only delete their own comments"
            )
    
    try:
        change_log = ChangeLog(
            defect_id=defect_id,
            user_id=current_user.id,
            field_name='comment',
            old_value=comment.content[:100] if len(comment.content) > 100 else comment.content,
            new_value=None,
            change_type='delete'
        )
        db.add(change_log)
        
        db.delete(comment)
        db.commit()
        
        return None
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete comment: {str(e)}"
        )
