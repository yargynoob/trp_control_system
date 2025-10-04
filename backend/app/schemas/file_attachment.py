"""File attachment schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FileAttachmentBase(BaseModel):
    """Base file attachment schema."""
    filename: str = Field(..., max_length=255)
    original_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_size: int = Field(..., gt=0)
    content_type: Optional[str] = Field(None, max_length=100)


class FileAttachmentCreate(FileAttachmentBase):
    """File attachment create schema."""
    defect_id: Optional[int] = None
    comment_id: Optional[int] = None
    uploaded_by: int


class FileAttachmentInDB(FileAttachmentBase):
    """File attachment in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    defect_id: Optional[int]
    comment_id: Optional[int]
    uploaded_by: int
    uploaded_at: datetime
    is_deleted: bool


class FileAttachment(FileAttachmentInDB):
    """File attachment response schema."""
    pass
