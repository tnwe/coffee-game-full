"""
Game endpoints for the Coffee Game API
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date, datetime

from app.db.session import get_db
from app.models import Game, GamePlayer, Player
from app.schemas import GameCreate, GameResponse, GameListResponse, GameDetailResponse

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/", response_model=GameListResponse, summary="List all games")
def read_games(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    payer_id: Optional[int] = Query(None, description="Filter by payer ID"),
    fetcher_id: Optional[int] = Query(None, description="Filter by fetcher ID"),
    participant_id: Optional[int] = Query(None, description="Filter by participant ID"),
    is_doublette: Optional[bool] = Query(None, description="Filter by doublette status"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of games to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Retrieve a list of games with optional filtering.
    
    Supports filtering by:
    - Date range (start_date, end_date)
    - Payer or fetcher ID
    - Participant ID
    - Doublette status
    - Pagination (limit, offset)
    """
    query = db.query(Game)
    
    # Date filtering
    if start_date:
        query = query.filter(Game.date >= start_date)
    if end_date:
        query = query.filter(Game.date <= end_date)
    
    # Payer/fetcher filtering
    if payer_id:
        query = query.filter(Game.payer_id == payer_id)
    if fetcher_id:
        query = query.filter(Game.fetcher_id == fetcher_id)
    
    # Doublette filtering
    if is_doublette is not None:
        if is_doublette:
            query = query.filter(Game.payer_id == Game.fetcher_id)
        else:
            query = query.filter(
                or_(
                    Game.payer_id != Game.fetcher_id,
                    Game.payer_id.is_(None),
                    Game.fetcher_id.is_(None)
                )
            )
    
    # Order by date (descending)
    query = query.order_by(Game.date.desc())
    
    # Pagination
    query = query.limit(limit).offset(offset)
    
    games = query.all()
    total = db.query(Game).count()
    
    # Build detailed responses
    game_responses = []
    for game in games:
        game_response = build_game_detail_response(db, game)
        game_responses.append(game_response)
    
    return GameListResponse(
        games=game_responses,
        total=total
    )


@router.post("/", response_model=GameDetailResponse, status_code=status.HTTP_201_CREATED, summary="Create a new game")
def create_game(
    game_data: GameCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new coffee game session.
    
    - **date**: Game date (required)
    - **players**: List of participant player IDs (required)
    - **payer_id**: ID of the player who pays (optional)
    - **fetcher_id**: ID of the player who fetches coffee (optional)
    - **notes**: Optional notes
    """
    # Validate date is not in the future
    if game_data.date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game date cannot be in the future"
        )
    
    # Check if game already exists for this date
    existing_game = db.query(Game).filter(Game.date == game_data.date).first()
    if existing_game:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A game already exists for date {game_data.date}"
        )
    
    # Validate player IDs
    player_ids = set(game_data.players)
    valid_players = db.query(Player.id).all()
    valid_player_ids = {p.id for p in valid_players}
    
    invalid_ids = player_ids - valid_player_ids
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid player IDs: {sorted(invalid_ids)}"
        )
    
    # Validate payer and fetcher are in participants
    if game_data.payer_id and game_data.payer_id not in player_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer must be one of the participants"
        )
    if game_data.fetcher_id and game_data.fetcher_id not in player_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fetcher must be one of the participants"
        )
    
    # Create the game
    db_game = Game(
        date=game_data.date,
        payer_id=game_data.payer_id,
        fetcher_id=game_data.fetcher_id,
        notes=game_data.notes
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    # Add participants
    for player_id in game_data.players:
        gp = GamePlayer(game_id=db_game.id, player_id=player_id)
        db.add(gp)
    
    # Grant immunity to payer
    if game_data.payer_id:
        payer = db.query(Player).filter(Player.id == game_data.payer_id).first()
        if payer:
            payer.has_immunity = True
            db.commit()
    
    db.commit()
    db.refresh(db_game)
    
    return build_game_detail_response(db, db_game)


@router.put("/{game_id}", response_model=GameDetailResponse, summary="Update a game")
def update_game(
    game_id: int,
    game_data: GameCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing game.
    
    **Warning**: This will replace all existing participants.
    """
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with ID {game_id} not found"
        )
    
    # Validate date
    if game_data.date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game date cannot be in the future"
        )
    
    # Check if another game exists for the new date
    if game_data.date != db_game.date:
        existing_game = db.query(Game).filter(
            Game.date == game_data.date,
            Game.id != game_id
        ).first()
        if existing_game:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A game already exists for date {game_data.date}"
            )
    
    # Validate player IDs
    player_ids = set(game_data.players)
    valid_players = db.query(Player.id).all()
    valid_player_ids = {p.id for p in valid_players}
    
    invalid_ids = player_ids - valid_player_ids
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid player IDs: {sorted(invalid_ids)}"
        )
    
    # Validate payer and fetcher are in participants
    if game_data.payer_id and game_data.payer_id not in player_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer must be one of the participants"
        )
    if game_data.fetcher_id and game_data.fetcher_id not in player_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fetcher must be one of the participants"
        )
    
    # Update game
    db_game.date = game_data.date
    db_game.payer_id = game_data.payer_id
    db_game.fetcher_id = game_data.fetcher_id
    db_game.notes = game_data.notes
    db_game.updated_at = datetime.utcnow()
    
    # Remove existing participants
    db.query(GamePlayer).filter(GamePlayer.game_id == game_id).delete()
    
    # Add new participants
    for player_id in game_data.players:
        gp = GamePlayer(game_id=game_id, player_id=player_id)
        db.add(gp)
    
    # Update immunity
    if game_data.payer_id:
        payer = db.query(Player).filter(Player.id == game_data.payer_id).first()
        if payer:
            payer.has_immunity = True
            db.commit()
    
    db.commit()
    db.refresh(db_game)
    
    return build_game_detail_response(db, db_game)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a game")
def delete_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a game from the system.
    
    **Warning**: This action cannot be undone.
    """
    db_game = db.query(Game).filter(Game.id == game_id).first()
    if not db_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with ID {game_id} not found"
        )
    
    db.delete(db_game)
    db.commit()
    
    return None


@router.get("/recent", response_model=GameListResponse, summary="Get recent games")
def get_recent_games(
    limit: int = Query(10, ge=1, le=50, description="Number of recent games to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve the most recent games.
    """
    games = db.query(Game).order_by(Game.date.desc()).limit(limit).all()
    
    game_responses = []
    for game in games:
        game_response = build_game_detail_response(db, game)
        game_responses.append(game_response)
    
    return GameListResponse(
        games=game_responses,
        total=len(game_responses)
    )


@router.get("/today", response_model=Optional[GameDetailResponse], summary="Get today's game")
def get_today_game(
    db: Session = Depends(get_db)
):
    """
    Retrieve the game for today's date, if it exists.
    """
    today = date.today()
    game = db.query(Game).filter(Game.date == today).first()
    
    if not game:
        return None
    
    return build_game_detail_response(db, game)


@router.get("/{game_id}", response_model=GameDetailResponse, summary="Get game details")
def read_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed information for a specific game.
    """
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with ID {game_id} not found"
        )

    return build_game_detail_response(db, game)


def build_game_detail_response(db: Session, game: Game) -> GameDetailResponse:
    """
    Helper function to build a detailed game response
    """
    # Get participants
    participants = db.query(GamePlayer).filter(
        GamePlayer.game_id == game.id
    ).all()
    
    # Build participant list
    participant_list = []
    for gp in participants:
        player = db.query(Player).filter(Player.id == gp.player_id).first()
        if player:
            participant_list.append({
                "id": player.id,
                "name": player.name,
                "has_immunity": player.has_immunity
            })
    
    # Build the response explicitly so legacy rows with NULL timestamps remain
    # readable after migrating from the original schema.
    response = GameDetailResponse(
        id=game.id,
        date=game.date,
        payer_id=game.payer_id,
        fetcher_id=game.fetcher_id,
        notes=game.notes,
        created_at=game.created_at,
        updated_at=game.updated_at,
        participant_count=game.participant_count,
        is_doublette=game.is_doublette,
    )
    
    # Add payer info
    if game.payer:
        response.payer = {
            "id": game.payer.id,
            "name": game.payer.name,
            "has_immunity": game.payer.has_immunity
        }
    
    # Add fetcher info
    if game.fetcher:
        response.fetcher = {
            "id": game.fetcher.id,
            "name": game.fetcher.name,
            "has_immunity": game.fetcher.has_immunity
        }
    
    response.participants = participant_list
    
    return response
