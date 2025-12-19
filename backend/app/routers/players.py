from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models, crud

router = APIRouter(prefix="/api/players", tags=["players"])


# Dependency DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# GET /api/players
@router.get("/")
def read_players(db: Session = Depends(get_db)):
    return crud.get_players(db)


# POST /api/players?name=Olivier
@router.post("/")
def add_player(name: str, db: Session = Depends(get_db)):
    clean_name = name.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")

    existing = (
        db.query(models.Player)
        .filter(models.Player.name.ilike(clean_name))
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Player already exists")

    return crud.create_player(db, clean_name)
