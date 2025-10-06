"""Report model."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.db.base import Base


class Report(Base):
    """Report model."""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    project_ids = Column(ARRAY(Integer), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    format = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    project = relationship("Project", back_populates="reports")
    creator = relationship("User", back_populates="reports")
    
    def __repr__(self):
        return f"<Report {self.id}: {self.title}>"
