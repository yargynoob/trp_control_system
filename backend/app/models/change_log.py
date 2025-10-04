from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class ChangeLog(Base):
    __tablename__ = "change_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        CheckConstraint(
            "change_type IN ('create', 'update', 'delete', 'status_change')",
            name="change_type_check"
        ),
    )
    
    defect = relationship("Defect", back_populates="change_logs")
    user = relationship("User", back_populates="change_logs")
    
    def __repr__(self):
        return f"<ChangeLog {self.id}: {self.change_type} on Defect {self.defect_id}>"
