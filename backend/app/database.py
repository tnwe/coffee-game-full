"""
Database configuration for backward compatibility
"""
from app.db.session import engine, Base, SessionLocal, get_db, init_db

# Backward compatibility aliases
engine = engine
Base = Base
SessionLocal = SessionLocal

def get_db():
    return get_db()

def init_db():
    return init_db()
