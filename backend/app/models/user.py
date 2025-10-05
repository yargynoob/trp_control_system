from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    first_name = Column(String(30))
    last_name = Column(String(150))
    is_active = Column(Boolean, default=True, index=True)
    is_superuser = Column(Boolean, default=False, index=True)
    date_joined = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    user_roles = relationship("UserRole", foreign_keys="UserRole.user_id", back_populates="user", cascade="all, delete-orphan")
    granted_roles = relationship("UserRole", foreign_keys="UserRole.granted_by")
    reported_defects = relationship("Defect", foreign_keys="Defect.reporter_id", back_populates="reporter")
    assigned_defects = relationship("Defect", foreign_keys="Defect.assignee_id", back_populates="assignee")
    comments = relationship("Comment", back_populates="author")
    change_logs = relationship("ChangeLog", back_populates="user")
    file_attachments = relationship("FileAttachment", back_populates="uploader")
    reports = relationship("Report", back_populates="creator")
    sent_notifications = relationship("Notification", foreign_keys="Notification.sender_id", back_populates="sender")
    received_notifications = relationship("Notification", foreign_keys="Notification.recipient_id", back_populates="recipient")
    
    def __repr__(self):
        return f"<User {self.username}>"
