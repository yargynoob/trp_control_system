"""Project schemas."""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    address: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    """Project create schema."""
    manager_id: Optional[int] = None
    user_roles: Optional[List[dict]] = None


class ProjectUpdate(BaseModel):
    """Project update schema."""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    user_roles: Optional[List[dict]] = None


class ProjectInDB(ProjectBase):
    """Project in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    status: str
    manager_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    is_active: bool


class Project(ProjectInDB):
    """Project response schema."""
    defects_count: Optional[int] = 0
    team_size: Optional[int] = 0


class ProjectDetail(Project):
    """Project detail schema with users."""
    users: Optional[List[dict]] = None
