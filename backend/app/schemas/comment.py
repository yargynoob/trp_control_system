"""Comment schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CommentBase(BaseModel):
    """Base comment schema."""
    content: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    """Comment create schema."""
    defect_id: int
    author_id: int


class CommentUpdate(BaseModel):
    """Comment update schema."""
    content: Optional[str] = Field(None, min_length=1)


class CommentInDB(CommentBase):
    """Comment in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    defect_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime


class Comment(CommentInDB):
    """Comment response schema."""
    author_name: Optional[str] = None
