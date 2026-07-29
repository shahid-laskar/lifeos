"""
Dhikr domain service.

Provides catalogue lookups and orchestrates session logging.
No AI, no network calls, no engagement metrics (ADR-008, Article 8, ADR-003).
"""
from __future__ import annotations

import uuid
from datetime import date as date_type, datetime, timezone

from app.domain.dhikr.entities import (
    DhikrCategory,
    DhikrItem,
    DhikrLog,
)
from app.domain.dhikr.dhikr_data import get_item, list_items
from app.domain.dhikr.repository import DhikrRepository
from app.domain.dhikr.models import DhikrDailySummaryResponse


class DhikrItemNotFoundError(ValueError):
    pass


class DhikrService:
    def __init__(self, repository: DhikrRepository) -> None:
        self._repo = repository

    # ── Catalogue ────────────────────────────────────────────────────────────

    def list_items(self, category: DhikrCategory | None = None) -> list[DhikrItem]:
        return list_items(category)

    def get_item(self, item_id: str) -> DhikrItem:
        item = get_item(item_id)
        if item is None:
            raise DhikrItemNotFoundError(f"Dhikr item '{item_id}' not found.")
        return item

    # ── Logging ──────────────────────────────────────────────────────────────

    def log_session(
        self,
        user_id: str,
        item_id: str,
        count: int,
        date: date_type,
    ) -> DhikrLog:
        item = self.get_item(item_id)

        log = DhikrLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            dhikr_item_id=item_id,
            category=item.category,
            count=count,
            date=date,
            logged_at=datetime.now(timezone.utc),
        )
        return self._repo.add_log(log)

    def get_daily_summary(
        self, user_id: str, date: date_type
    ) -> DhikrDailySummaryResponse:
        logs = self._repo.get_logs_for_date(user_id, date)

        summary = DhikrDailySummaryResponse(date=date)
        for log in logs:
            if log.category == DhikrCategory.MORNING:
                summary.total_morning += log.count
            elif log.category == DhikrCategory.EVENING:
                summary.total_evening += log.count
            elif log.category == DhikrCategory.POST_PRAYER:
                summary.total_post_prayer += log.count
            elif log.category == DhikrCategory.GENERAL:
                summary.total_general += log.count

        return summary
