"""Authentication schemas."""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Registration request schema."""
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = Field(None, max_length=30)
    last_name: Optional[str] = Field(None, max_length=150)


class UserResponse(BaseModel):
    """User response schema for auth."""
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    is_superuser: bool = False
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response with token and user data."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
