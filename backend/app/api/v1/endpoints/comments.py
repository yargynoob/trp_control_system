"""Comment endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.comment import Comment
from app.models.defect import Defect
from app.models.change_log import ChangeLog
from app.schemas.comment import Comment as CommentSchema, CommentCreate, CommentUpdate

router = APIRouter()


@router.get("/defect/{defect_id}", response_model=List[CommentSchema])
def get_defect_comments(
    defect_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all comments for a defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    comments = db.query(Comment).filter(
        Comment.defect_id == defect_id,
        Comment.is_deleted == False
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for comment in comments:
        comment_data = CommentSchema.model_validate(comment)
        if comment.author:
            comment_data.author_name = f"{comment.author.first_name} {comment.author.last_name}" if comment.author.first_name else comment.author.username
        result.append(comment_data)
    
    return result


@router.get("/{comment_id}", response_model=CommentSchema)
def get_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    """Get comment by ID."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    return comment


@router.post("/", response_model=CommentSchema, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_in: CommentCreate,
    db: Session = Depends(get_db)
):
    """Create new comment."""
    defect = db.query(Defect).filter(Defect.id == comment_in.defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    try:
        db_comment = Comment(**comment_in.model_dump())
        db.add(db_comment)
        db.flush()
        
        # Create change log
        change_log = ChangeLog(
            defect_id=comment_in.defect_id,
            user_id=comment_in.author_id,
            field_name="comment",
            new_value=f"Comment {db_comment.id}",
            change_type="update"
        )
        db.add(change_log)
        
        db.commit()
        db.refresh(db_comment)
        
        return db_comment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )


@router.put("/{comment_id}", response_model=CommentSchema)
def update_comment(
    comment_id: int,
    comment_in: CommentUpdate,
    db: Session = Depends(get_db)
):
    """Update comment."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    update_data = comment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)
    
    db.commit()
    db.refresh(comment)
    
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    """Delete comment (soft delete)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    comment.is_deleted = True
    db.commit()
    
    return None
