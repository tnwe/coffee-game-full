"""
Game schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date as DateType, datetime


class GameBase(BaseModel):
    """Base game schema"""
    date: DateType = Field(..., description="Game date")
    payer_id: Optional[int] = Field(None, description="ID of the player who pays")
    fetcher_id: Optional[int] = Field(None, description="ID of the player who fetches coffee")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")


class GameCreate(GameBase):
    """Schema for creating a new game"""
    players: List[int] = Field(..., description="List of participant player IDs")


class GameResponse(GameBase):
    """Schema for game response"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_doublette: bool = False
    participant_count: int = 0
    
    class Config:
        from_attributes = True


class GameDetailResponse(GameResponse):
    """Detailed game response with full player information"""
    payer: Optional[dict] = None
    fetcher: Optional[dict] = None
    participants: List[dict] = []


class GameListResponse(BaseModel):
    """Schema for listing games"""
    games: list[GameDetailResponse]
    total: int
