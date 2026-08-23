"""
Database configuration for backward compatibility.
"""
from app.db.session import (
    Base as _Base,
    SessionLocal as _SessionLocal,
    engine as _engine,
    get_db as _get_db,
    init_db as _init_db,
)

engine = _engine
Base = _Base
SessionLocal = _SessionLocal


def get_db():
    return _get_db()


def init_db():
    return _init_db()
