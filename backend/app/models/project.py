from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Enum, CheckConstraint, func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String)
    status = Column(String(20), default=ProjectStatus.ACTIVE.value, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    manager_id = Column(Integer, ForeignKey("users.id"))
    address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('planning', 'active', 'completed', 'cancelled')",
            name="projects_status_check"
        ),
    )
    
    user_roles = relationship("UserRole", back_populates="project", cascade="all, delete-orphan")
    defects = relationship("Defect", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.name}>"
