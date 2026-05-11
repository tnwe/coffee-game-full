import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

# Ajouter le chemin du projet au sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.models import Base, Player, WeekState

# Récupère l'URL de la base de données depuis les variables d'environnement
DATABASE_URL = os.getenv("DATABASE_URL")

# Crée une session vers la base de données
def get_db_session():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def reset_immunities_and_add_abas():
    db = get_db_session()
    try:
        # Remettre à zéro toutes les immunités
        players = db.query(Player).all()
        for player in players:
            player.has_immunity = False
        db.commit()

        # Ajouter l'immunité d'Abas
        abas = db.query(Player).filter(Player.name == "Abas").first()
        if abas:
            abas.has_immunity = True
            db.commit()

        # Mettre à jour WeekState pour indiquer que la remise à zéro a été faite aujourd'hui
        today = date.today()
        existing_state = db.query(WeekState).order_by(WeekState.id.desc()).first()
        if not existing_state or existing_state.last_reset_date < today:
            new_state = WeekState(last_reset_date=today, abas_immunity_added=True)
            db.add(new_state)
            db.commit()

        print("Immunités remises à zéro et immunité d'Abas ajoutée.")
    except Exception as e:
        print(f"Erreur : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_immunities_and_add_abas()