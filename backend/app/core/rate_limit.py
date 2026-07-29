"""
Rate limiting utilities.

Uses slowapi (a Starlette/FastAPI wrapper around limits) to enforce per-IP
limits on sensitive endpoints such as authentication and password reset.

Per 070_Backend_Security.md: rate limiting is a baseline security control,
not a business rule. It lives here in the core layer so domain code never
sees it.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address, default_limits=[])


def rate_limit_exceeded_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait before trying again."},
        headers={"Retry-After": str(exc.retry_after) if hasattr(exc, "retry_after") else "60"},
    )
