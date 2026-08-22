"""
Week state model for tracking weekly immunity resets
"""
from sqlalchemy import Column, Integer, Date, Boolean, DateTime
from sqlalchemy.sql import func

from app.db.session import Base


class WeekState(Base):
    """
    Model to track weekly state for immunity management
    """
    __tablename__ = "week_state"
    
    id = Column(Integer, primary_key=True, index=True)
    last_reset_date = Column(Date, nullable=False)
    abas_immunity_added = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<WeekState(id={self.id}, last_reset_date={self.last_reset_date})>"
