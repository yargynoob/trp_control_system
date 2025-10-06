"""Database models."""

# Import all models for Alembic autogenerate
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.project import Project
from app.models.defect import (
    Defect,
    DefectStatus,
    DefectCategory,
    Priority
)
from app.models.comment import Comment
from app.models.file_attachment import FileAttachment
from app.models.change_log import ChangeLog
from app.models.notification import Notification
from app.models.report import Report

__all__ = [
    "User",
    "Role",
    "UserRole",
    "Project",
    "Defect",
    "DefectStatus",
    "DefectCategory",
    "Priority",
    "Comment",
    "FileAttachment",
    "ChangeLog",
    "Notification",
    "Report",
]
