"""
Muslim Life OS - Backend API entrypoint.

Architecture reference: 059_Backend_Architecture_Overview.md,
062_API_Architecture.md. This is intentionally a single modular service
(ADR-001 in docs/decision-log.md) - not a microservices deployment.
"""
from fastapi import FastAPI

from app.api.v1 import prayer
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for Muslim Life OS. Governed by governance/CONSTITUTION.md - "
        "see that file before adding any feature, metric, or AI capability."
    ),
    version="0.1.0",
)

app.include_router(prayer.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    """Liveness endpoint. No business logic, no user data - see
    061_Service_Architecture.md 'health endpoints'."""
    return {"status": "ok", "service": settings.app_name}
