"""Notification schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class NotificationBase(BaseModel):
    """Base notification schema."""
    title: str = Field(..., max_length=255)
    message: Optional[str] = None
    notification_type: str = Field(..., max_length=50)


class NotificationCreate(NotificationBase):
    """Notification create schema."""
    recipient_id: int
    sender_id: Optional[int] = None
    defect_id: Optional[int] = None


class NotificationUpdate(BaseModel):
    """Notification update schema."""
    is_read: bool


class NotificationInDB(NotificationBase):
    """Notification in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    recipient_id: int
    sender_id: Optional[int]
    defect_id: Optional[int]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]


class Notification(NotificationInDB):
    """Notification response schema."""
    pass
