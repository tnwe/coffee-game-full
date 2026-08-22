"""
Player endpoints for the Coffee Game API
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models import Player
from app.schemas import PlayerCreate, PlayerUpdate, PlayerResponse, PlayerListResponse

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=PlayerListResponse, summary="List all players")
def read_players(
    db: Session = Depends(get_db),
    active_only: bool = Query(False, description="Filter by active players only"),
    search: Optional[str] = Query(None, description="Search players by name")
):
    """
    Retrieve a list of all players with optional filtering.
    
    - **active_only**: Filter to only show players with recent activity
    - **search**: Filter players by name (case-insensitive partial match)
    """
    query = db.query(Player)
    
    if search:
        query = query.filter(Player.name.ilike(f"%{search}%"))
    
    players = query.order_by(Player.name.asc()).all()
    
    # Calculate stats for each player
    player_responses = []
    for player in players:
        player_response = PlayerResponse.from_orm(player)
        player_response.total_paid = player.total_paid
        player_response.total_fetched = player.total_fetched
        player_response.total_participations = player.total_participations
        player_response.score = player.score
        player_response.normalized_score = player.normalized_score
        player_responses.append(player_response)
    
    return PlayerListResponse(
        players=player_responses,
        total=len(player_responses)
    )


@router.get("/{player_id}", response_model=PlayerResponse, summary="Get player details")
def read_player(
    player_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve details for a specific player by ID.
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with ID {player_id} not found"
        )
    
    player_response = PlayerResponse.from_orm(player)
    player_response.total_paid = player.total_paid
    player_response.total_fetched = player.total_fetched
    player_response.total_participations = player.total_participations
    player_response.score = player.score
    player_response.normalized_score = player.normalized_score
    
    return player_response


@router.post("/", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED, summary="Create a new player")
def create_player(
    player: PlayerCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new player with the given name.
    
    - **name**: Player name (required, unique, 1-100 characters)
    """
    # Check if player already exists
    existing_player = db.query(Player).filter(
        Player.name.ilike(player.name.strip())
    ).first()
    
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Player '{player.name}' already exists"
        )
    
    # Create new player
    db_player = Player(name=player.name.strip())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    
    player_response = PlayerResponse.from_orm(db_player)
    player_response.total_paid = 0
    player_response.total_fetched = 0
    player_response.total_participations = 0
    player_response.score = 0
    player_response.normalized_score = 0.0
    
    return player_response


@router.put("/{player_id}", response_model=PlayerResponse, summary="Update a player")
def update_player(
    player_id: int,
    player_update: PlayerUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing player's information.
    
    - **name**: New player name (optional)
    - **has_immunity**: Immunity status (optional)
    """
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with ID {player_id} not found"
        )
    
    # Check if new name conflicts with existing player
    if player_update.name and player_update.name.strip():
        existing = db.query(Player).filter(
            Player.id != player_id,
            Player.name.ilike(player_update.name.strip())
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player '{player_update.name}' already exists"
            )
        db_player.name = player_update.name.strip()
    
    # Update immunity status
    if player_update.has_immunity is not None:
        db_player.has_immunity = player_update.has_immunity
    
    db_player.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_player)
    
    player_response = PlayerResponse.from_orm(db_player)
    player_response.total_paid = db_player.total_paid
    player_response.total_fetched = db_player.total_fetched
    player_response.total_participations = db_player.total_participations
    player_response.score = db_player.score
    player_response.normalized_score = db_player.normalized_score
    
    return player_response


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a player")
def delete_player(
    player_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a player from the system.
    
    **Warning**: This will also remove all game participations for this player.
    """
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with ID {player_id} not found"
        )
    
    db.delete(db_player)
    db.commit()
    
    return None


@router.post("/{player_id}/toggle-immunity", response_model=PlayerResponse, summary="Toggle player immunity")
def toggle_immunity(
    player_id: int,
    db: Session = Depends(get_db)
):
    """
    Toggle the immunity status of a player.
    """
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with ID {player_id} not found"
        )
    
    db_player.has_immunity = not db_player.has_immunity
    db_player.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_player)
    
    player_response = PlayerResponse.from_orm(db_player)
    player_response.total_paid = db_player.total_paid
    player_response.total_fetched = db_player.total_fetched
    player_response.total_participations = db_player.total_participations
    player_response.score = db_player.score
    player_response.normalized_score = db_player.normalized_score
    
    return player_response
