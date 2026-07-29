"""
Audit logging for sensitive actions.

Per 070_Backend_Security.md: "audit logging for sensitive actions" is a
baseline security control. Audit events are structured log entries — they
go to the same log stream as request logs but are tagged with
`audit=True` so they can be routed separately in production.

Privacy rule (Article 9): audit logs record *what happened* and *who*
(by user_id, never email), never *worship content* (prayer states,
Qur'an progress, Dhikr counts). Those are private user data.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("mlos.audit")


def log_event(
    event: str,
    user_id: str | None = None,
    *,
    extra: dict[str, Any] | None = None,
) -> None:
    """Emit a structured audit log entry.

    Args:
        event: Short, stable event name (e.g. "auth.login", "auth.register").
        user_id: The acting user, if known. Use None for pre-auth events.
        extra: Additional non-sensitive fields (e.g. ip_hint, outcome).
    """
    payload: dict[str, Any] = {
        "audit": True,
        "event": event,
        "user_id": user_id or "anonymous",
        **(extra or {}),
    }
    logger.info("audit_event", extra=payload)
