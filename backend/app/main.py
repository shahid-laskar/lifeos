"""
Muslim Life OS - Backend API entrypoint.

Architecture reference: 059_Backend_Architecture_Overview.md,
062_API_Architecture.md. This is intentionally a single modular service
(ADR-001 in docs/decision-log.md) - not a microservices deployment.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import ai, auth, families, governance, prayer, users, habits, quran, dhikr, duas, hadith, learning, planner, tasks, goals, calendar, reviews, productivity, journal, reading, skills
from app.core.config import get_settings
from app.core.db import Base, engine
from app.core.middleware import (
    SecureHeadersMiddleware,
    RequestLoggingMiddleware,
    configure_cors,
)
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.infrastructure import orm_models  # noqa: F401 - registers ORM models with Base
from slowapi.errors import RateLimitExceeded

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Schema managed by Alembic migrations — run `alembic upgrade head` before starting.
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Middleware order matters: outermost runs first on request, last on response.
# CORS must be outermost so preflight OPTIONS requests are handled before auth.
configure_cors(app, settings)
app.add_middleware(SecureHeadersMiddleware, environment=settings.environment)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(prayer.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(habits.router, prefix=settings.api_v1_prefix)
app.include_router(quran.router, prefix=settings.api_v1_prefix)
app.include_router(dhikr.router, prefix=settings.api_v1_prefix)
app.include_router(duas.router, prefix=settings.api_v1_prefix)
app.include_router(hadith.router, prefix=settings.api_v1_prefix)
app.include_router(ai.router, prefix=settings.api_v1_prefix)
app.include_router(families.router, prefix=settings.api_v1_prefix)
app.include_router(governance.router, prefix=settings.api_v1_prefix)
app.include_router(learning.router, prefix=settings.api_v1_prefix)
app.include_router(planner.router, prefix=settings.api_v1_prefix)
app.include_router(tasks.router, prefix=settings.api_v1_prefix)
app.include_router(goals.router, prefix=settings.api_v1_prefix)
app.include_router(calendar.router, prefix=settings.api_v1_prefix)
app.include_router(reviews.router, prefix=settings.api_v1_prefix)
app.include_router(productivity.router, prefix=settings.api_v1_prefix)
app.include_router(journal.router, prefix=settings.api_v1_prefix)
app.include_router(reading.router, prefix=settings.api_v1_prefix)
app.include_router(skills.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    """Liveness endpoint. No business logic, no user data."""
    return {"status": "ok", "service": settings.app_name, "version": app.version}


@app.get("/ready", tags=["system"])
def readiness_check() -> dict:
    """Readiness endpoint: confirms the application and database are ready to serve traffic.

    Per 061_Service_Architecture.md: liveness (/health) and readiness (/ready)
    are separate so orchestrators can distinguish between "restarting a crashed
    process" and "holding traffic until ready".
    """
    from sqlalchemy import text
    from app.core.db import engine as _engine
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:  # noqa: BLE001
        db_status = "unavailable"

    overall = "ok" if db_status == "ok" else "degraded"
    return {"status": overall, "checks": {"database": db_status}}
