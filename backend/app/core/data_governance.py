"""
Data governance: classification, retention rules, and consent tracking.

Per ADR-012 / Volume 07 (Data & Analytics):
- All data fields are classified by sensitivity.
- Retention periods are documented per domain.
- Deletion and export workflows are defined here.
- No engagement telemetry (DAU, session duration, streak counters).
- Only privacy-safe operational events are permitted (errors, latency, sync
  outcomes, feature availability).

This module provides the policy layer. Actual deletion is executed by the
domain services and repositories.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol, runtime_checkable


class DataClassification(str, Enum):
    """Sensitivity classification for data fields.

    Based on the principle of minimum necessary data (Article 9).
    """
    PUBLIC = "public"            # Quran metadata, Dhikr catalogue items
    OPERATIONAL = "operational"  # Anonymised error logs, latency, sync outcomes
    PERSONAL = "personal"        # Email, timezone, prayer preferences
    SENSITIVE = "sensitive"      # Prayer logs, Quran progress, Dhikr sessions
    RESTRICTED = "restricted"    # AI conversations, memory entries, family data


@dataclass(frozen=True)
class RetentionPolicy:
    domain: str
    classification: DataClassification
    retention_days: int | None  # None = user-controlled, no automatic deletion
    deletion_on_account_close: bool
    export_supported: bool
    notes: str


RETENTION_POLICIES: tuple[RetentionPolicy, ...] = (
    RetentionPolicy(
        domain="user_profile",
        classification=DataClassification.PERSONAL,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes="Retained until user deletes account. Export includes profile fields.",
    ),
    RetentionPolicy(
        domain="prayer_logs",
        classification=DataClassification.SENSITIVE,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes=(
            "Prayer logs are private by default (Article 9). "
            "Not shared with family members unless explicitly opted in."
        ),
    ),
    RetentionPolicy(
        domain="quran_progress",
        classification=DataClassification.SENSITIVE,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes="Reading position and bookmarks. Private by default.",
    ),
    RetentionPolicy(
        domain="dhikr_sessions",
        classification=DataClassification.SENSITIVE,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes="Dhikr session counts. Private by default.",
    ),
    RetentionPolicy(
        domain="ai_conversations",
        classification=DataClassification.RESTRICTED,
        retention_days=365,
        deletion_on_account_close=True,
        export_supported=True,
        notes=(
            "AI conversations are stored for 365 days then purged. "
            "User can delete individual conversations at any time. "
            "Never used for model training without explicit separate consent."
        ),
    ),
    RetentionPolicy(
        domain="ai_memory",
        classification=DataClassification.RESTRICTED,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes="Opt-in memory entries. User can inspect and delete at any time.",
    ),
    RetentionPolicy(
        domain="family_data",
        classification=DataClassification.RESTRICTED,
        retention_days=None,
        deletion_on_account_close=True,
        export_supported=True,
        notes="Family membership and invitations. Worship data is never shared.",
    ),
    RetentionPolicy(
        domain="operational_logs",
        classification=DataClassification.OPERATIONAL,
        retention_days=90,
        deletion_on_account_close=False,
        export_supported=False,
        notes=(
            "Anonymised errors, latency, sync outcomes. "
            "No user IDs in logs. No worship performance data. "
            "Purged after 90 days."
        ),
    ),
)

RETENTION_BY_DOMAIN: dict[str, RetentionPolicy] = {p.domain: p for p in RETENTION_POLICIES}


# ── Permitted operational events ─────────────────────────────────────────────

PERMITTED_OPERATIONAL_EVENTS = frozenset({
    "api.error",
    "api.latency_exceeded",
    "auth.login.success",
    "auth.login.failed",
    "auth.register.success",
    "auth.register.failed",
    "sync.success",
    "sync.failed",
    "sync.conflict",
    "feature.unavailable",
    "frontend.crash",
    "deploy.completed",
    "deploy.rolled_back",
})

PROHIBITED_EVENTS = frozenset({
    # These are explicitly prohibited by ADR-003 and Article 2/9.
    "prayer.streak",
    "quran.reading_speed",
    "session.duration",
    "dau",
    "notification.opened",
    "engagement.score",
    "piety.score",
    "worship.performance",
})


def is_event_permitted(event_name: str) -> bool:
    """Return True if the event is in the permitted operational events set."""
    return event_name in PERMITTED_OPERATIONAL_EVENTS


# ── User data export protocol ──────────────────────────────────────────────────

@runtime_checkable
class DataExportService(Protocol):
    """Protocol for exporting a user's personal data on request."""

    def export_user_data(self, user_id: str) -> dict: ...


# ── Account deletion protocol ─────────────────────────────────────────────────

@runtime_checkable
class AccountDeletionService(Protocol):
    """Protocol for deleting all data for a user on account closure."""

    def delete_user_data(self, user_id: str) -> None: ...
