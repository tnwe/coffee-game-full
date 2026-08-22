"""
Seed data for the Coffee Game application
"""
from app.db.session import SessionLocal
from app.models import Player, WeekState
from datetime import date

def seed_players():
    """
    Seed initial players if they don't exist
    """
    db = SessionLocal()
    try:
        initial_players = [
            "Experto",
            "Rainier",
            "Sabine",
            "Thibault",
            "Abas",
            "Nicolas",
            "Andr",
            "Sandrine",
            "Michelle",
            "Philippe",
            "Jeff",
        ]

        for name in initial_players:
            exists = db.query(Player).filter(Player.name == name).first()
            if not exists:
                db.add(Player(name=name))

        db.commit()
        
        # Seed week state
        week_state = db.query(WeekState).first()
        if not week_state:
            db.add(WeekState(
                last_reset_date=date.today(),
                abas_immunity_added=False
            ))
            db.commit()
            
    finally:
        db.close()
