from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from .database import engine, Base, SessionLocal
from .routers import players, games, stats
from . import models
from .seed import seed_players

app = FastAPI(title="Le jeu du café API")


def reset_immunities():
    db = SessionLocal()
    try:
        # Réinitialiser toutes les immunités
        db.query(models.Player).update({"has_immunity": False})
        db.commit()

        # Attribuer une immunité à "Abas"
        abas = db.query(models.Player).filter(models.Player.name == "Abas").first()
        if abas:
            abas.has_immunity = True
            db.commit()
            print(f"Immunity granted to Abas at {datetime.now()}")
        else:
            print("Warning: Player 'Abas' not found in database")

    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(
    reset_immunities,
    trigger=CronTrigger(day_of_week="mon", hour=8, timezone="Europe/Paris"),
    id="reset_immunities",
    name="Reset all player immunities and grant to Abas every Monday at 8 AM",
    replace_existing=True,
)
scheduler.start()


@app.on_event("startup")
def startup_event():
    # créer les tables
    Base.metadata.create_all(bind=engine)

    # seed
    seed_players()


@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers
app.include_router(players.router)
app.include_router(games.router)
app.include_router(stats.router)

# SERVE FRONTEND
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR.parent / "frontend_dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_index():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"error": "index.html not found"}

else:
    @app.get("/", include_in_schema=False)
    def placeholder():
        return {"message": "Frontend not built yet"}