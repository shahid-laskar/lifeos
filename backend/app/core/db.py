"""
Database session management.

Shared platform infrastructure (061_Service_Architecture.md "Platform
Services") - not part of any single domain. Domains depend on this only
through the Repository abstractions in their own modules, never directly
in domain services (063_Domain_Driven_Design.md "Repositories should not
expose database implementation details").
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
