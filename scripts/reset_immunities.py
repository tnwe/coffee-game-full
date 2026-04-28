import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ajouter le chemin du projet au sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.models import Base, Player

# Récupère l'URL de la base de données depuis les variables d'environnement
DATABASE_URL = os.getenv("DATABASE_URL")

# Crée une session vers la base de données
def get_db_session():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

# Remet à zéro les immunités de tous les joueurs
def reset_immunities():
    db = get_db_session()
    try:
        players = db.query(Player).all()
        for player in players:
            player.has_immunity = False
        db.commit()
        print("Immunités remises à zéro pour tous les joueurs.")
    except Exception as e:
        print(f"Erreur lors de la remise à zéro des immunités : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_immunities()