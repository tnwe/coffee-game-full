from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import SessionLocal
from .. import models
from collections import defaultdict

router = APIRouter(prefix="/api/stats", tags=["stats"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def compute_stats(db: Session = Depends(get_db)):
    total_games = db.query(func.count(models.Game.id)).scalar() or 0
    total_doublettes = db.query(func.count(models.Game.id)).filter(models.Game.payer_id == models.Game.fetcher_id).scalar() or 0

    # payers
    payers = db.query(models.Player.name, func.count(models.Game.id)).join(models.Game, models.Game.payer_id==models.Player.id).group_by(models.Player.id).all()
    payers_list = [(r[0], int(r[1])) for r in payers]

    # fetchers
    fetchers = db.query(models.Player.name, func.count(models.Game.id)).join(models.Game, models.Game.fetcher_id==models.Player.id).group_by(models.Player.id).all()
    fetchers_list = [(r[0], int(r[1])) for r in fetchers]

    # participations
    parts = db.query(models.Player.name, func.count(models.GamePlayer.game_id)).join(models.GamePlayer, models.GamePlayer.player_id==models.Player.id).group_by(models.Player.id).all()
    parts_list = [(r[0], int(r[1])) for r in parts]

    # doublettes per player
    dbl = db.query(models.Player.name, func.count(models.Game.id)).join(models.Game, models.Game.payer_id==models.Player.id).filter(models.Game.payer_id == models.Game.fetcher_id).group_by(models.Player.id).all()
    dbl_list = [(r[0], int(r[1])) for r in dbl]

    return {
        "total_games": int(total_games),
        "total_doublettes": int(total_doublettes),
        "payers": payers_list,
        "fetchers": fetchers_list,
        "participations": parts_list,
        "doublettes_by_player": dbl_list
    }
