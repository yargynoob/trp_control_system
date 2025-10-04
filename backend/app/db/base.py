"""Base class for all database models."""

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from app.models.user import User
from app.models.role import Role, UserRole
from app.models.project import Project
from app.models.defect import Defect, DefectStatus, Priority, DefectCategory
from app.models.comment import Comment
from app.models.file_attachment import FileAttachment
from app.models.change_log import ChangeLog
from app.models.notification import Notification
