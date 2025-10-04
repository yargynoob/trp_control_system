"""Defect schemas."""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class DefectBase(BaseModel):
    """Base defect schema."""
    title: str = Field(..., max_length=255)
    description: str
    location: Optional[str] = Field(None, max_length=500)
    priority_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    estimated_hours: Optional[Decimal] = None


class DefectCreate(DefectBase):
    """Defect create schema."""
    project_id: int
    reporter_id: int
    status_id: Optional[int] = None


class DefectUpdate(BaseModel):
    """Defect update schema."""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=500)
    status_id: Optional[int] = None
    priority_id: Optional[int] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None


class DefectInDB(DefectBase):
    """Defect in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    number: str
    project_id: int
    status_id: int
    reporter_id: int
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    actual_hours: Optional[Decimal] = None


class Defect(DefectInDB):
    """Defect response schema."""
    pass


class DefectList(BaseModel):
    """Defect list item schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    number: str
    title: str
    status: str
    priority: str
    location: Optional[str]
    assignee_name: Optional[str]
    reporter_name: Optional[str]
    created_at: datetime
    due_date: Optional[date]


class DefectStatusBase(BaseModel):
    """Base defect status schema."""
    name: str = Field(..., max_length=20)
    display_name: str = Field(..., max_length=50)
    description: Optional[str] = None
    color_code: Optional[str] = Field(None, max_length=7)
    order_index: int
    is_initial: bool = False
    is_final: bool = False


class DefectStatus(DefectStatusBase):
    """Defect status response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class PriorityBase(BaseModel):
    """Base priority schema."""
    name: str = Field(..., max_length=20)
    display_name: str = Field(..., max_length=50)
    color_code: Optional[str] = Field(None, max_length=7)
    urgency_level: int = Field(..., ge=1, le=10)
    description: Optional[str] = None


class Priority(PriorityBase):
    """Priority response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
