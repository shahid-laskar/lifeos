from __future__ import annotations

from typing import Protocol
from datetime import date as date_type

from app.domain.dhikr.entities import DhikrCategory, DhikrLog


class DhikrRepository(Protocol):
    def add_log(self, log: DhikrLog) -> DhikrLog:
        ...

    def get_logs_for_date(
        self, user_id: str, date: date_type, category: DhikrCategory | None = None
    ) -> list[DhikrLog]:
        ...
