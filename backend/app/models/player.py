"""
Player model definition
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.db.session import Base


class Player(Base):
    """
    Player model representing a participant in the coffee game
    """
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    has_immunity = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    games_paid = relationship(
        "Game", 
        foreign_keys="Game.payer_id", 
        back_populates="payer",
        lazy="selectin"
    )
    games_fetched = relationship(
        "Game", 
        foreign_keys="Game.fetcher_id", 
        back_populates="fetcher",
        lazy="selectin"
    )
    participations = relationship(
        "GamePlayer", 
        back_populates="player",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Player(id={self.id}, name='{self.name}')>"
    
    @property
    def total_paid(self) -> int:
        """Number of games this player has paid for"""
        return len(self.games_paid) if self.games_paid else 0
    
    @property
    def total_fetched(self) -> int:
        """Number of games this player has fetched coffee"""
        return len(self.games_fetched) if self.games_fetched else 0
    
    @property
    def total_participations(self) -> int:
        """Total number of games this player has participated in"""
        return len(self.participations) if self.participations else 0
    
    @property
    def score(self) -> int:
        """Player's score (paid + fetched)"""
        return self.total_paid + self.total_fetched
    
    @property
    def normalized_score(self) -> float:
        """Normalized score based on participations"""
        if self.total_participations == 0:
            return 0.0
        return self.score / self.total_participations
