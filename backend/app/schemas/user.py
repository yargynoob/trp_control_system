"""User schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=30)
    last_name: Optional[str] = Field(None, max_length=150)


class UserCreate(UserBase):
    """User create schema."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    first_name: Optional[str] = Field(None, max_length=30)
    last_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User in database schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    date_joined: datetime
    last_login: Optional[datetime] = None


class User(UserInDB):
    """User response schema."""
    pass


class UserList(BaseModel):
    """User list item schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    email: EmailStr
    is_active: bool
