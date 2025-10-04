"""Defect models."""

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Numeric, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class DefectStatus(Base):
    """Defect status model."""
    
    __tablename__ = "defect_statuses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    display_name = Column(String(50), nullable=False)
    description = Column(String)
    color_code = Column(String(7))
    order_index = Column(Integer, nullable=False)
    is_initial = Column(Boolean, default=False)
    is_final = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    defects = relationship("Defect", back_populates="status")
    
    def __repr__(self):
        return f"<DefectStatus {self.name}>"


class Priority(Base):
    __tablename__ = "priorities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    display_name = Column(String(50), nullable=False)
    color_code = Column(String(7))
    urgency_level = Column(Integer, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "urgency_level BETWEEN 1 AND 10",
            name="priorities_urgency_check"
        ),
    )
    
    defects = relationship("Defect", back_populates="priority")
    
    def __repr__(self):
        return f"<Priority {self.name}>"


class DefectCategory(Base):
    """Defect category model."""
    
    __tablename__ = "defect_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String)
    parent_id = Column(Integer, ForeignKey("defect_categories.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    defects = relationship("Defect", back_populates="category")
    
    def __repr__(self):
        return f"<DefectCategory {self.name}>"


class Defect(Base):
    """Defect model."""
    
    __tablename__ = "defects"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    location = Column(String(500))
    
        
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("defect_categories.id"), index=True)
    status_id = Column(Integer, ForeignKey("defect_statuses.id"), nullable=False, index=True)
    priority_id = Column(Integer, ForeignKey("priorities.id"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    
    
    estimated_hours = Column(Numeric(5, 2))
    actual_hours = Column(Numeric(5, 2))
    
    __table_args__ = (
        CheckConstraint(
            "estimated_hours IS NULL OR estimated_hours > 0",
            name="defects_hours_check"
        ),
        CheckConstraint(
            "actual_hours IS NULL OR actual_hours > 0",
            name="defects_actual_hours_check"
        ),
    )
    
    project = relationship("Project", back_populates="defects")
    category = relationship("DefectCategory", back_populates="defects")
    status = relationship("DefectStatus", back_populates="defects")
    priority = relationship("Priority", back_populates="defects")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_defects")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_defects")
    comments = relationship("Comment", back_populates="defect", cascade="all, delete-orphan")
    file_attachments = relationship("FileAttachment", back_populates="defect", cascade="all, delete-orphan")
    change_logs = relationship("ChangeLog", back_populates="defect", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="defect", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Defect {self.number}: {self.title}>"
