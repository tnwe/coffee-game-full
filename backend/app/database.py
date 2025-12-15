from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

SQLALCHEMY_DATABASE_URL = os.getenv("postgresql://coffee_game_db_uanh_user:DUKZ0DlqPj4YlNoRhpDP4pC0rt7lUVHx@dpg-d4u3i0mmcj7s73drdolg-a/coffee_game_db_uanh")

print(">>> DATABASE_URL =", DATABASE_URL)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)



SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def seed_players(db):
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
        existing = db.query(models.Player).filter(models.Player.name == name).first()
        if not existing:
            db.add(models.Player(name=name))

    db.commit()
