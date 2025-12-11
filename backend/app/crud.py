from sqlalchemy.orm import Session
from . import models
from datetime import date
from typing import List

def create_player(db: Session, name: str):
    p = models.Player(name=name)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def get_players(db: Session):
    return db.query(models.Player).order_by(models.Player.name).all()

def create_game(db: Session, game_date: date, player_ids: List[int], payer_id: int=None, fetcher_id: int=None):
    g = models.Game(date=game_date, payer_id=payer_id, fetcher_id=fetcher_id)
    db.add(g)
    db.commit()
    db.refresh(g)
    # add participations
    for pid in player_ids:
        gp = models.GamePlayer(game_id=g.id, player_id=pid)
        db.add(gp)
    db.commit()
    return g

def list_games(db: Session):
    games = db.query(models.Game).order_by(models.Game.date.desc()).all()
    out = []
    for g in games:
        participants = [gp.player_id for gp in db.query(models.GamePlayer).filter(models.GamePlayer.game_id==g.id).all()]
        out.append({
            "id": g.id,
            "date": g.date.isoformat(),
            "payer_id": g.payer_id,
            "fetcher_id": g.fetcher_id,
            "payer_name": g.payer.name if g.payer else None,
            "fetcher_name": g.fetcher.name if g.fetcher else None,
            "participants": participants
        })
    return out
