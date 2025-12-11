from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, crud

router = APIRouter(prefix="/api/players", tags=["players"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def read_players(db: Session = Depends(get_db)):
    return crud.get_players(db)

@router.post("/")
def add_player(name: str, db: Session = Depends(get_db)):
    existing = db.query(models.Player).filter(models.Player.name==name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player exists")
    return crud.create_player(db, name)
