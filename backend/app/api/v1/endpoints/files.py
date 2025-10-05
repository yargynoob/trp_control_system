"""File upload endpoints."""

import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.db import get_db
from app.core.config import settings
from app.models.file_attachment import FileAttachment
from app.models.defect import Defect
from app.models.change_log import ChangeLog
from app.models.user import User
from app.schemas.file_attachment import FileAttachment as FileAttachmentSchema
from app.core.deps import get_current_user

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_upload_file(upload_file: UploadFile, defect_id: int) -> dict:
    """Save uploaded file to disk."""
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    defect_dir = UPLOAD_DIR / f"defect_{defect_id}"
    defect_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = defect_dir / unique_filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
    
    return {
        "filename": unique_filename,
        "original_name": upload_file.filename,
        "file_path": str(file_path),
        "file_size": os.path.getsize(file_path),
        "content_type": upload_file.content_type
    }


@router.post("/upload", response_model=FileAttachmentSchema, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    defect_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload file to defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    file.file.seek(0, 2)  
    file_size = file.file.tell()
    file.file.seek(0)  
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    try:
        file_data = save_upload_file(file, defect_id)
        
        db_file = FileAttachment(
            defect_id=defect_id,
            filename=file_data["filename"],
            original_name=file_data["original_name"],
            file_path=file_data["file_path"],
            file_size=file_data["file_size"],
            content_type=file_data["content_type"],
            uploaded_by=current_user.id
        )
        db.add(db_file)
        db.flush()
        
        change_log = ChangeLog(
            defect_id=defect_id,
            user_id=current_user.id,
            field_name="attachment",
            new_value=file_data["original_name"],
            change_type="update"
        )
        db.add(change_log)
        
        db.commit()
        db.refresh(db_file)
        
        return db_file
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/defect/{defect_id}", response_model=List[FileAttachmentSchema])
def get_defect_files(
    defect_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all files for a defect."""
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )
    
    files = db.query(FileAttachment).filter(
        FileAttachment.defect_id == defect_id,
        FileAttachment.is_deleted == False
    ).all()
    
    return files


@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download file."""
    file_record = db.query(FileAttachment).filter(
        FileAttachment.id == file_id,
        FileAttachment.is_deleted == False
    ).first()
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_path = Path(file_record.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=file_path,
        filename=file_record.original_name,
        media_type=file_record.content_type
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete file (soft delete)."""
    file_record = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_record.is_deleted = True
    db.commit()
    
    return None
