"""
Player schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PlayerBase(BaseModel):
    """Base player schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Player name")


class PlayerCreate(PlayerBase):
    """Schema for creating a new player"""
    pass


class PlayerUpdate(BaseModel):
    """Schema for updating a player"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    has_immunity: Optional[bool] = Field(None, description="Whether player has immunity")


class PlayerResponse(PlayerBase):
    """Schema for player response"""
    id: int
    has_immunity: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime]
    total_paid: int = 0
    total_fetched: int = 0
    total_participations: int = 0
    score: int = 0
    normalized_score: float = 0.0
    
    class Config:
        from_attributes = True


class PlayerListResponse(BaseModel):
    """Schema for listing players"""
    players: list[PlayerResponse]
    total: int
