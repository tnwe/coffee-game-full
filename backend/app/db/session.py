"""
Database session management
"""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.declarative import DeclarativeMeta
from typing import Generator

from app.core.config import settings

# Create the SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base: DeclarativeMeta = declarative_base()


def get_db() -> Generator:
    """
    Dependency that provides a database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _quote_identifier(identifier: str) -> str:
    """Quote a SQL identifier for the active database dialect."""
    return engine.dialect.identifier_preparer.quote(identifier)


def _add_missing_columns():
    """
    Add model columns that are absent from existing tables.

    SQLAlchemy's create_all() creates missing tables, but it does not alter
    tables that already exist. This lightweight schema reconciliation keeps
    deployments with the pre-V2 schema bootable without requiring a separate
    migration command.
    """
    inspector = inspect(engine)

    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue

            existing_columns = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue

                column_name = _quote_identifier(column.name)
                column_type = column.type.compile(dialect=engine.dialect)
                nullable = "" if column.nullable else " NOT NULL"
                table_name = _quote_identifier(table.name)
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{nullable}")
                )


def init_db():
    """
    Initialize the database tables and reconcile simple additive schema changes.
    """
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
