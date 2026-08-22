"""
Statistics schemas for API responses
"""
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date


class PlayerStatsResponse(BaseModel):
    """Statistics for a single player"""
    player_id: int
    player_name: str
    participations: int = 0
    paid: int = 0
    fetched: int = 0
    score: int = 0
    normalized_score: float = 0.0
    doublette_count: int = 0
    coffees_paid_for: int = 0


class StatsResponse(BaseModel):
    """Overall statistics response"""
    total_games: int = 0
    total_participations: int = 0
    total_coffees_drunk: int = 0
    total_doublettes: int = 0
    doublette_percentage: float = 0.0
    
    # Player statistics
    players: List[PlayerStatsResponse] = []
    
    # Top performers
    top_payers: List[Dict[str, int]] = []
    top_fetchers: List[Dict[str, int]] = []
    top_participants: List[Dict[str, int]] = []
    top_scores: List[Dict[str, float]] = []
    
    # Recent games
    recent_games: List[Dict] = []
    
    # Monthly statistics
    monthly_stats: List[Dict] = []
