from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

print(">>> DATABASE_URL =", DATABASE_URL)

# SQLite
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL (Render)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
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
