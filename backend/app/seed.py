from .database import SessionLocal
from . import models

def seed_players():
    db = SessionLocal()

    initial_players = [
        "Olivier",
        "Rainier",
        "Sabine",
        "Thibault",
        "Abas",
        "Nicolas",
        "Andrés",
        "Sandrine",
        "Michelle",
        "Philippe",
        "Jeff",
    ]

    for name in initial_players:
        exists = db.query(models.Player).filter(models.Player.name == name).first()
        if not exists:
            db.add(models.Player(name=name))

    db.commit()
    db.close()
