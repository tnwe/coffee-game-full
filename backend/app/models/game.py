"""
Game model definition
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.db.session import Base


class Game(Base):
    """
    Game model representing a coffee game session
    """
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    payer_id = Column(Integer, ForeignKey("players.id"), nullable=True, index=True)
    fetcher_id = Column(Integer, ForeignKey("players.id"), nullable=True, index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    payer = relationship(
        "Player", 
        foreign_keys=[payer_id], 
        back_populates="games_paid",
        lazy="joined"
    )
    fetcher = relationship(
        "Player", 
        foreign_keys=[fetcher_id], 
        back_populates="games_fetched",
        lazy="joined"
    )
    participants = relationship(
        "GamePlayer", 
        back_populates="game",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Game(id={self.id}, date={self.date})>"
    
    @property
    def is_doublette(self) -> bool:
        """Check if payer and fetcher are the same person"""
        return self.payer_id == self.fetcher_id and self.payer_id is not None
    
    @property
    def participant_count(self) -> int:
        """Number of participants in this game"""
        return len(self.participants) if self.participants else 0
    
    @property
    def participant_ids(self) -> list[int]:
        """List of participant IDs"""
        return [gp.player_id for gp in self.participants] if self.participants else []


class GamePlayer(Base):
    """
    Association table between games and players
    """
    __tablename__ = "game_players"
    
    game_id = Column(Integer, ForeignKey("games.id"), primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    game = relationship("Game", back_populates="participants")
    player = relationship("Player", back_populates="participations")
    
    def __repr__(self):
        return f"<GamePlayer(game_id={self.game_id}, player_id={self.player_id})>"
