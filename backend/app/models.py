from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    payer_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    fetcher_id = Column(Integer, ForeignKey("players.id"), nullable=True)

    payer = relationship("Player", foreign_keys=[payer_id], lazy="joined")
    fetcher = relationship("Player", foreign_keys=[fetcher_id], lazy="joined")

class GamePlayer(Base):
    __tablename__ = "game_players"
    game_id = Column(Integer, ForeignKey("games.id"), primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), primary_key=True)
