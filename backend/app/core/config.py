"""Application configuration."""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings."""
    
    # Project
    PROJECT_NAME: str = "TRP Control System"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "12345678"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5169
    POSTGRES_DB: str = "TRP"
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """Assemble database URL from components."""
        if isinstance(v, str):
            return v
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_HOST')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [
        ".jpg", ".jpeg", ".png", ".gif", ".pdf", 
        ".doc", ".docx", ".xls", ".xlsx"
    ]
    
    # Email (optional)
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Sentry (optional)
    SENTRY_DSN: Optional[str] = None
    
    # PostgreSQL Tools Path (for backups)
    PG_BIN_PATH: Optional[str] = None  # Path to PostgreSQL bin directory (e.g., "C:\Program Files\PostgreSQL\17\bin")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
