from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models, crud, schemas

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


# PUT /api/players/{player_id}
@router.put("/{player_id}")
def update_player(player_id: int, player_update: schemas.PlayerUpdate, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    update_data = player_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_player, key, value)
    
    db.commit()
    db.refresh(db_player)
    return db_player