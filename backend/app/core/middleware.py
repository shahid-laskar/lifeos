"""
Security middleware: CORS, secure HTTP headers, and structured request logging.

References: 070_Backend_Security.md, 062_API_Architecture.md.
All middleware decisions are environment-aware — development allows broad
origins; production requires explicit allow-list via MLOS_ALLOWED_ORIGINS.
"""
from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("mlos.request")


# ── CORS ──────────────────────────────────────────────────────────────────────

def configure_cors(app, settings) -> None:
    """Attach CORS middleware.

    Development: allow localhost on common Vite/preview ports.
    Production: only origins listed in MLOS_ALLOWED_ORIGINS.
    """
    if settings.environment == "development":
        origins = [
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:8081",
            # Network IP — allows browsers on the LAN to reach the API
            "http://10.44.0.209:5173",
            "http://10.44.0.209:8080",
            "http://10.44.0.209:8081",
        ]
    else:
        origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )


# ── Secure HTTP headers ───────────────────────────────────────────────────────

class SecureHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response.

    Per 070_Backend_Security.md: headers that browsers enforce as a safety
    net (CSP, HSTS, X-Frame, etc.) should be set by the application layer so
    they are not dependent on infrastructure configuration.
    """

    def __init__(self, app, environment: str = "development") -> None:
        super().__init__(app)
        self._environment = environment

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )
        if self._environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response


# ── Structured request logging / correlation IDs ─────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Attach a correlation ID to every request and emit a structured log line.

    Privacy rule: no request bodies, no user IDs, no worship-domain paths are
    logged in detail. Only method, path (sanitised), status, and latency.
    This is operational diagnostics, not behaviour analytics (ADR-012, Article 9).
    """

    _SENSITIVE_PREFIXES = ("/api/v1/auth/", "/api/v1/users/")

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start = time.perf_counter()

        response = await call_next(request)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
        path = request.url.path

        # Mask paths that carry user-specific information.
        log_path = "<auth>" if any(path.startswith(p) for p in self._SENSITIVE_PREFIXES) else path

        logger.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": log_path,
                "status": response.status_code,
                "elapsed_ms": elapsed_ms,
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response
