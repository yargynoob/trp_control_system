"""Report schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ReportFormat(str, Enum):
    """Report format enum."""
    CSV = "csv"
    EXCEL = "excel"


class ReportCreate(BaseModel):
    """Report create schema."""
    project_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    format: ReportFormat


class ReportResponse(BaseModel):
    """Report response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    created_by: int
    creator_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    format: str  # 'csv' or 'excel'
    file_path: str
    file_size: Optional[int] = None
    created_at: datetime


class ReportList(BaseModel):
    """Report list schema."""
    reports: list[ReportResponse]
    total: int
