"""Change log schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ChangeLogBase(BaseModel):
    """Base change log schema."""
    field_name: str = Field(..., max_length=100)
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_type: str = Field(..., max_length=20)


class ChangeLogCreate(ChangeLogBase):
    """Change log create schema."""
    defect_id: int
    user_id: int


class ChangeLogInDB(ChangeLogBase):
    """Change log in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    defect_id: int
    user_id: int
    created_at: datetime


class ChangeLog(ChangeLogInDB):
    """Change log response schema."""
    user_name: Optional[str] = None
    action_description: Optional[str] = None
