from __future__ import annotations

from typing import Protocol
from datetime import date as date_type

from app.domain.habit.entities import PrayerLogRecord, PrayerName

class HabitRepository(Protocol):
    def log_prayer(self, record: PrayerLogRecord) -> PrayerLogRecord:
        ...

    def get_prayer_logs_for_date_range(
        self, user_id: str, start_date: date_type, end_date: date_type
    ) -> list[PrayerLogRecord]:
        ...

    def get_prayer_log(
        self, user_id: str, date: date_type, prayer_name: PrayerName
    ) -> PrayerLogRecord | None:
        ...
