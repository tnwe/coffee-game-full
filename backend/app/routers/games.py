from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import SessionLocal
from .. import crud
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/api/games", tags=["games"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GameIn(BaseModel):
    date: str
    players: List[int]
    payer: Optional[int] = None
    fetcher: Optional[int] = None

@router.post("/")
def create_game(payload: GameIn, db: Session = Depends(get_db)):
    try:
        d = date.fromisoformat(payload.date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date")
    # ensure players exist
    if not payload.players:
        raise HTTPException(status_code=400, detail="No players selected")
    game = crud.create_game(db, d, payload.players, payload.payer, payload.fetcher)
    return {"ok": True, "game_id": game.id}

@router.get("/")
def get_games(db: Session = Depends(get_db)):
    return crud.list_games(db)
