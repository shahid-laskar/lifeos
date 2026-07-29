"""
Unit tests for the Dhikr domain service.
"""
from __future__ import annotations

from datetime import date as date_type, datetime, timezone
import uuid

import pytest

from app.domain.dhikr.entities import DhikrCategory, DhikrLog
from app.domain.dhikr.service import (
    DhikrItemNotFoundError,
    DhikrService,
)


class FakeDhikrRepository:
    def __init__(self) -> None:
        self._logs: dict[str, DhikrLog] = {}

    def add_log(self, log: DhikrLog) -> DhikrLog:
        self._logs[log.id] = log
        return log

    def get_logs_for_date(
        self, user_id: str, date: date_type, category: DhikrCategory | None = None
    ) -> list[DhikrLog]:
        logs = [
            log for log in self._logs.values()
            if log.user_id == user_id and log.date == date
        ]
        if category:
            logs = [log for log in logs if log.category == category]
        return logs


@pytest.fixture
def service() -> DhikrService:
    return DhikrService(FakeDhikrRepository())


USER = "user-001"
DATE = date_type(2026, 7, 29)


# ── Catalogue ───────────────────────────────────────────────────────────────


def test_list_items(service: DhikrService) -> None:
    items = service.list_items()
    assert len(items) > 0
    
    # Check filtering
    morning_items = service.list_items(DhikrCategory.MORNING)
    assert len(morning_items) > 0
    assert all(i.category == DhikrCategory.MORNING for i in morning_items)


def test_get_item(service: DhikrService) -> None:
    item = service.get_item("morning-01")
    assert item.id == "morning-01"
    assert item.category == DhikrCategory.MORNING


def test_get_invalid_item_raises(service: DhikrService) -> None:
    with pytest.raises(DhikrItemNotFoundError):
        service.get_item("invalid-id")


# ── Logging ─────────────────────────────────────────────────────────────────


def test_log_session(service: DhikrService) -> None:
    log = service.log_session(USER, "morning-01", 1, DATE)
    assert log.user_id == USER
    assert log.dhikr_item_id == "morning-01"
    assert log.count == 1
    assert log.date == DATE


def test_log_session_invalid_item_raises(service: DhikrService) -> None:
    with pytest.raises(DhikrItemNotFoundError):
        service.log_session(USER, "invalid-id", 1, DATE)


def test_get_daily_summary(service: DhikrService) -> None:
    # Log multiple sessions across categories
    service.log_session(USER, "morning-01", 1, DATE)
    service.log_session(USER, "morning-02", 3, DATE)
    service.log_session(USER, "evening-01", 10, DATE)
    service.log_session(USER, "general-01", 33, DATE)
    service.log_session(USER, "general-01", 67, DATE) # log same item again

    summary = service.get_daily_summary(USER, DATE)
    assert summary.date == DATE
    assert summary.total_morning == 4
    assert summary.total_evening == 10
    assert summary.total_post_prayer == 0
    assert summary.total_general == 100


def test_no_engagement_fields_on_dhikr_entities(service: DhikrService) -> None:
    """ADR-003 / Article 2: no streak-style fields should appear on domain entities."""
    log = service.log_session(USER, "morning-01", 1, DATE)
    log_fields = {f for f in vars(log)}
    assert "streak" not in log_fields
    assert "session_duration" not in log_fields
    assert "total_ever" not in log_fields
