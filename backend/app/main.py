from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from .database import engine, Base
from .routers import players, games, stats
from . import models

# create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Coffee Game API")

# CORS (frontend served from same origin, but keep permissive)
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

# Serve frontend_dist static files
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR.parent / "frontend_dist"

if FRONTEND_DIST.exists():
    # serve assets and index
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
