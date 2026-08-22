"""
Statistics endpoints for the Coffee Game API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, case
from typing import List, Dict, Optional
from datetime import date, datetime, timedelta
from collections import defaultdict

from app.db.session import get_db
from app.models import Game, GamePlayer, Player
from app.schemas import StatsResponse, PlayerStatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/", response_model=StatsResponse, summary="Get comprehensive statistics")
def get_stats(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None, description="Start date for statistics"),
    end_date: Optional[date] = Query(None, description="End date for statistics"),
    player_id: Optional[int] = Query(None, description="Filter stats for specific player")
):
    """
    Retrieve comprehensive statistics for the coffee game.
    
    Returns overall statistics including:
    - Total games and participations
    - Player statistics (paid, fetched, score, normalized score)
    - Top performers in various categories
    - Recent games
    - Monthly statistics
    """
    # Date filtering
    query_filter = []
    if start_date:
        query_filter.append(Game.date >= start_date)
    if end_date:
        query_filter.append(Game.date <= end_date)
    
    game_query = db.query(Game)
    if query_filter:
        game_query = game_query.filter(*query_filter)
    
    # Get all games in period
    games = game_query.order_by(Game.date.desc()).all()
    
    # Get all players
    players = db.query(Player).order_by(Player.name).all()
    
    # Filter by player if specified
    if player_id:
        games = [g for g in games if player_id in g.participant_ids]
    
    # Calculate overall statistics
    total_games = len(games)
    total_participations = sum(g.participant_count for g in games)
    total_coffees_drunk = total_participations
    total_doublettes = sum(1 for g in games if g.is_doublette)
    doublette_percentage = (total_doublettes / total_games * 100) if total_games > 0 else 0.0
    
    # Calculate per-player statistics
    player_stats = calculate_player_stats(db, games, players)
    
    # Calculate top performers
    top_payers = sorted(
        [(p.name, p.total_paid) for p in players if p.total_paid > 0],
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    top_fetchers = sorted(
        [(p.name, p.total_fetched) for p in players if p.total_fetched > 0],
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    top_participants = sorted(
        [(p.name, p.total_participations) for p in players if p.total_participations > 0],
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    top_scores = sorted(
        [(p.name, p.normalized_score) for p in players if p.total_participations > 0],
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    # Recent games (last 10)
    recent_games = []
    for game in games[:10]:
        recent_games.append({
            "id": game.id,
            "date": game.date.isoformat(),
            "payer_name": game.payer.name if game.payer else None,
            "fetcher_name": game.fetcher.name if game.fetcher else None,
            "participant_count": game.participant_count,
            "is_doublette": game.is_doublette
        })
    
    # Monthly statistics
    monthly_stats = calculate_monthly_stats(games)
    
    # Build response
    response = StatsResponse(
        total_games=total_games,
        total_participations=total_participations,
        total_coffees_drunk=total_coffees_drunk,
        total_doublettes=total_doublettes,
        doublette_percentage=round(doublette_percentage, 2),
        players=player_stats,
        top_payers=[{"name": name, "count": count} for name, count in top_payers],
        top_fetchers=[{"name": name, "count": count} for name, count in top_fetchers],
        top_participants=[{"name": name, "count": count} for name, count in top_participants],
        top_scores=[{"name": name, "score": round(score, 2)} for name, score in top_scores],
        recent_games=recent_games,
        monthly_stats=monthly_stats
    )
    
    return response


@router.get("/player/{player_id}", response_model=PlayerStatsResponse, summary="Get player statistics")
def get_player_stats(
    player_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed statistics for a specific player.
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found")
    
    # Get all games
    games = db.query(Game).all()
    
    # Calculate player stats
    player_stats = []
    for p in [player]:
        stats = calculate_player_stats(db, games, [p])
        if stats:
            player_stats = stats
    
    if not player_stats:
        # Return empty stats if no games
        return PlayerStatsResponse(
            player_id=player.id,
            player_name=player.name,
            participations=0,
            paid=0,
            fetched=0,
            score=0,
            normalized_score=0.0,
            doublette_count=0,
            coffees_paid_for=0
        )
    
    return player_stats[0]


@router.get("/daily", summary="Get daily statistics")
def get_daily_stats(
    db: Session = Depends(get_db),
    limit: int = Query(30, ge=1, le=365, description="Number of days to return")
):
    """
    Retrieve daily statistics for the last N days.
    """
    today = date.today()
    start_date = today - timedelta(days=limit - 1)
    
    # Get games in date range
    games = db.query(Game).filter(
        Game.date >= start_date,
        Game.date <= today
    ).order_by(Game.date).all()
    
    # Group by date
    daily_data = []
    current_date = start_date
    
    while current_date <= today:
        date_games = [g for g in games if g.date == current_date]
        daily_data.append({
            "date": current_date.isoformat(),
            "games_count": len(date_games),
            "participants_count": sum(g.participant_count for g in date_games),
            "doublettes_count": sum(1 for g in date_games if g.is_doublette)
        })
        current_date += timedelta(days=1)
    
    return {"daily_stats": daily_data}


@router.get("/leaderboard", summary="Get leaderboard data")
def get_leaderboard(
    db: Session = Depends(get_db),
    metric: str = Query("score", description="Metric to rank by: score, paid, fetched, participations, normalized_score"),
    limit: int = Query(20, ge=1, le=100, description="Number of entries to return")
):
    """
    Retrieve the leaderboard ranked by a specific metric.
    """
    players = db.query(Player).all()
    games = db.query(Game).all()
    
    player_stats = calculate_player_stats(db, games, players)
    
    # Sort by metric
    if metric == "paid":
        sorted_stats = sorted(player_stats, key=lambda x: x.paid, reverse=True)
    elif metric == "fetched":
        sorted_stats = sorted(player_stats, key=lambda x: x.fetched, reverse=True)
    elif metric == "participations":
        sorted_stats = sorted(player_stats, key=lambda x: x.participations, reverse=True)
    elif metric == "normalized_score":
        sorted_stats = sorted(player_stats, key=lambda x: x.normalized_score, reverse=True)
    else:  # Default to score
        sorted_stats = sorted(player_stats, key=lambda x: x.score, reverse=True)
    
    # Format response
    leaderboard = []
    for i, stats in enumerate(sorted_stats[:limit], 1):
        leaderboard.append({
            "rank": i,
            "player_id": stats.player_id,
            "player_name": stats.player_name,
            "value": getattr(stats, metric),
            "participations": stats.participations,
            "paid": stats.paid,
            "fetched": stats.fetched,
            "score": stats.score,
            "normalized_score": round(stats.normalized_score, 2)
        })
    
    return {"leaderboard": leaderboard, "metric": metric}


def calculate_player_stats(db: Session, games: List[Game], players: List[Player]) -> List[PlayerStatsResponse]:
    """
    Calculate comprehensive statistics for all players.
    """
    player_stats = []
    
    for player in players:
        # Count participations
        participations = len([
            g for g in games 
            if player.id in g.participant_ids
        ])
        
        # Count paid and fetched
        paid = len([g for g in games if g.payer_id == player.id])
        fetched = len([g for g in games if g.fetcher_id == player.id])
        
        # Count doublettes
        doublette_count = len([
            g for g in games 
            if g.is_doublette and g.payer_id == player.id
        ])
        
        # Calculate coffees paid for
        coffees_paid_for = sum(
            g.participant_count for g in games 
            if g.payer_id == player.id
        )
        
        # Calculate scores
        score = paid + fetched
        normalized_score = (score / participations) if participations > 0 else 0.0
        
        player_stats.append(PlayerStatsResponse(
            player_id=player.id,
            player_name=player.name,
            participations=participations,
            paid=paid,
            fetched=fetched,
            score=score,
            normalized_score=round(normalized_score, 2),
            doublette_count=doublette_count,
            coffees_paid_for=coffees_paid_for
        ))
    
    return player_stats


def calculate_monthly_stats(games: List[Game]) -> List[Dict]:
    """
    Calculate monthly statistics.
    """
    monthly_data = defaultdict(lambda: {
        "games_count": 0,
        "participants_count": 0,
        "doublettes_count": 0
    })
    
    for game in games:
        month_key = game.date.strftime("%Y-%m")
        monthly_data[month_key]["games_count"] += 1
        monthly_data[month_key]["participants_count"] += game.participant_count
        if game.is_doublette:
            monthly_data[month_key]["doublettes_count"] += 1
    
    # Sort by month
    sorted_months = sorted(monthly_data.keys())
    
    return [
        {
            "month": month,
            "games_count": data["games_count"],
            "participants_count": data["participants_count"],
            "doublettes_count": data["doublettes_count"]
        }
        for month, data in monthly_data.items()
    ]
