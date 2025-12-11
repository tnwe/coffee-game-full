from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from .database import engine, Base, SessionLocal
from .routers import players, games, stats
from . import models
from .database import seed_players

app = FastAPI(title="Coffee Game API")

# ───────────────────────────────
# DATABASE INIT + SEED ON STARTUP
# ───────────────────────────────

@app.on_event("startup")
def startup_event():
    # create DB tables
    Base.metadata.create_all(bind=engine)

    # seed players
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
        existing = db.query(models.Player).filter(models.Player.name == name).first()
        if not existing:
            db.add(models.Player(name=name))

    db.commit()    
    db.close()


# ───────────────────────────────
# CORS CONFIG
# ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(players.router)
app.include_router(games.router)
app.include_router(stats.router)

# ───────────────────────────────
# SERVE FRONTEND
# ───────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR.parent / "frontend_dist"

if FRONTEND_DIST.exists():
    # serve assets and index.html
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
