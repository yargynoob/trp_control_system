"""Report schemas."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


class ReportFormat(str, Enum):
    """Report format enum."""
    CSV = "csv"
    EXCEL = "excel"


class ReportCreate(BaseModel):
    """Report create schema."""
    project_id: Optional[int] = None
    project_ids: Optional[List[int]] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    format: ReportFormat
    
    @field_validator('project_ids')
    @classmethod
    def validate_project_reference(cls, v, info):
        """Ensure either project_id or project_ids is set, but not both."""
        project_id = info.data.get('project_id')
        if project_id is None and (v is None or len(v) == 0):
            raise ValueError('Either project_id or project_ids must be provided')
        if project_id is not None and v is not None:
            raise ValueError('Cannot specify both project_id and project_ids')
        return v


class ReportResponse(BaseModel):
    """Report response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: Optional[int] = None
    project_ids: Optional[List[int]] = None
    created_by: int
    creator_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    format: str
    file_path: str
    file_size: Optional[int] = None
    created_at: datetime


class ReportList(BaseModel):
    """Report list schema."""
    reports: list[ReportResponse]
    total: int
