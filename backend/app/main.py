"""
Muslim Life OS - Backend API entrypoint.

Architecture reference: 059_Backend_Architecture_Overview.md,
062_API_Architecture.md. This is intentionally a single modular service
(ADR-001 in docs/decision-log.md) - not a microservices deployment.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import auth, prayer, users
from app.core.config import get_settings
from app.core.db import Base, engine
from app.infrastructure import orm_models  # noqa: F401 - registers ORM models with Base

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev-only table creation. ADR-004 notes Alembic migrations are follow-up
    # work once the schema needs controlled evolution beyond initial setup.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for Muslim Life OS. Governed by governance/CONSTITUTION.md - "
        "see that file before adding any feature, metric, or AI capability."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(prayer.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    """Liveness endpoint. No business logic, no user data - see
    061_Service_Architecture.md 'health endpoints'."""
    return {"status": "ok", "service": settings.app_name}
