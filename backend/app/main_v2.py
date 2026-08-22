"""
Main application entry point for Coffee Game V2
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import logging

from app.core.config import settings
from app.db.session import engine, Base, init_db
from app.api.v1.endpoints import players, games, stats
from app.models import Player
from app.seed import seed_players

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    # Coffee Game API V2
    
    API for managing coffee game sessions among colleagues.
    
    ## Features
    
    * **Players**: Manage participants in the coffee game
    * **Games**: Record and manage coffee game sessions
    * **Statistics**: Comprehensive statistics and analytics
    
    ## Authentication
    
    Currently, this API is open and does not require authentication.
    
    ## Rate Limiting
    
    No rate limiting is currently implemented.
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS
)

# Include API routers
app.include_router(
    players.router,
    prefix="/api/v1",
    tags=["players"]
)
app.include_router(
    games.router,
    prefix="/api/v1",
    tags=["games"]
)
app.include_router(
    stats.router,
    prefix="/api/v1",
    tags=["stats"]
)

# Legacy endpoints for backward compatibility
app.include_router(
    players.router,
    prefix="/api",
    tags=["players_legacy"]
)
app.include_router(
    games.router,
    prefix="/api",
    tags=["games_legacy"]
)
app.include_router(
    stats.router,
    prefix="/api",
    tags=["stats_legacy"]
)


@app.on_event("startup")
def startup_event():
    """
    Initialize database and seed data on startup
    """
    logger.info("Starting Coffee Game V2...")
    
    # Create tables
    init_db()
    logger.info("Database tables initialized")
    
    # Seed initial players
    seed_players()
    logger.info("Initial players seeded")
    
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")


@app.on_event("shutdown")
def shutdown_event():
    """
    Cleanup on shutdown
    """
    logger.info("Shutting down Coffee Game V2...")


# Health check endpoint
@app.get("/health", summary="Health check")
@app.get("/api/health", summary="API Health check")
@app.get("/api/v1/health", summary="API V1 Health check")
def health_check():
    """
    Check if the API is running correctly.
    """
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": Path(__file__).resolve().parent.parent
    }


# Root endpoint
@app.get("/", include_in_schema=False)
@app.get("/api", include_in_schema=False)
@app.get("/api/v1", include_in_schema=False)
def root():
    """
    Root endpoint returning API information.
    """
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "redoc": "/api/redoc",
        "health": "/health"
    }


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
        return JSONResponse(
            content={
                "message": "Frontend not built yet",
                "app": settings.APP_NAME,
                "version": settings.APP_VERSION
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_v2:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
