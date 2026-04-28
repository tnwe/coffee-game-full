from .database import SessionLocal
from . import models
from datetime import date

def check_and_add_abas_immunity():
    db = SessionLocal()
    try:
        today = date.today()

        # Vérifier s'il existe déjà un état pour cette semaine
        current_week_state = db.query(models.WeekState).order_by(models.WeekState.id.desc()).first()

        # Si c'est lundi et qu'il n'y a pas d'état pour cette semaine ou que la dernière remise à zéro date d'avant ce lundi
        if today.weekday() == 0:  # 0 = lundi
            if not current_week_state or current_week_state.last_reset_date < today:
                # Créer un nouvel état pour la semaine
                new_state = models.WeekState(last_reset_date=today, abas_immunity_added=False)
                db.add(new_state)
                db.commit()

                # Ajouter l'immunité d'Abas
                abas = db.query(models.Player).filter(models.Player.name == "Abas").first()
                if abas:
                    abas.has_immunity = True
                    db.commit()
                    print("Immunité d'Abas ajoutée pour la semaine.")
            elif current_week_state and current_week_state.last_reset_date == today and not current_week_state.abas_immunity_added:
                # Si la remise à zéro a été faite aujourd'hui mais que l'immunité d'Abas n'a pas encore été ajoutée
                abas = db.query(models.Player).filter(models.Player.name == "Abas").first()
                if abas:
                    abas.has_immunity = True
                    current_week_state.abas_immunity_added = True
                    db.commit()
                    print("Immunité d'Abas ajoutée pour la semaine.")
    finally:
        db.close()

def seed_players():
    db = SessionLocal()
    try:
        initial_players = [
            "Experto",
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
    finally:    
        db.close()