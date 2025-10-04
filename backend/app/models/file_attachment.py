from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class FileAttachment(Base):
    __tablename__ = "file_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="CASCADE"), index=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), index=True)
   
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    content_type = Column(String(100))
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False)
    
    __table_args__ = (
        CheckConstraint(
            "file_size > 0 AND file_size <= 10485760",
            name="file_size_check"
        ),
        CheckConstraint(
            "(defect_id IS NOT NULL AND comment_id IS NULL) OR (defect_id IS NULL AND comment_id IS NOT NULL)",
            name="file_relation_check"
        ),
    )
    
    defect = relationship("Defect", back_populates="file_attachments")
    uploader = relationship("User", back_populates="file_attachments")
    
    def __repr__(self):
        return f"<FileAttachment {self.filename}>"
