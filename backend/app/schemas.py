"""
Schemas for backward compatibility
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date as DateType, datetime


class PlayerBase(BaseModel):
    name: str


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    has_immunity: Optional[bool] = None


class Player(PlayerBase):
    id: int
    has_immunity: bool = False
    
    class Config:
        from_orm = True


class GameBase(BaseModel):
    date: DateType
    payer_id: Optional[int] = None
    fetcher_id: Optional[int] = None


class GameCreate(GameBase):
    players: List[int]


class Game(GameBase):
    id: int
    
    class Config:
        from_orm = True
