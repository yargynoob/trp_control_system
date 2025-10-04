from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="CASCADE"))
    
    title = Column(String(255), nullable=False)
    message = Column(Text)
    notification_type = Column(String(50), nullable=False)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    __table_args__ = (
        CheckConstraint(
            "notification_type IN ('defect_assigned', 'status_changed', 'comment_added', 'due_date_approaching', 'overdue')",
            name="notification_type_check"
        ),
    )
    
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_notifications")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_notifications")
    defect = relationship("Defect", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id}: {self.notification_type}>"
