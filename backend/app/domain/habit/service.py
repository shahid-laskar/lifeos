from __future__ import annotations

import uuid
from datetime import date as date_type, datetime, timedelta, timezone

from app.domain.habit.entities import PrayerLogRecord, PrayerName, PrayerStatus
from app.domain.habit.models import ConsistencyMetrics, DailyPrayerStatus
from app.domain.habit.repository import HabitRepository


class HabitService:
    def __init__(self, repository: HabitRepository):
        self._repository = repository

    def log_prayer(
        self, user_id: str, date: date_type, prayer_name: PrayerName, status: PrayerStatus
    ) -> PrayerLogRecord:
        now = datetime.now(timezone.utc)
        
        # Check if log already exists
        existing = self._repository.get_prayer_log(user_id, date, prayer_name)
        if existing:
            existing.status = status
            existing.updated_at = now
            return self._repository.log_prayer(existing)

        record = PrayerLogRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            date=date,
            prayer_name=prayer_name,
            status=status,
            created_at=now,
            updated_at=now,
        )
        return self._repository.log_prayer(record)

    def get_daily_status(self, user_id: str, date: date_type) -> DailyPrayerStatus:
        logs = self._repository.get_prayer_logs_for_date_range(user_id, date, date)
        
        status = DailyPrayerStatus(date=date)
        for log in logs:
            if log.prayer_name == PrayerName.FAJR:
                status.fajr = log.status
            elif log.prayer_name == PrayerName.DHUHR:
                status.dhuhr = log.status
            elif log.prayer_name == PrayerName.ASR:
                status.asr = log.status
            elif log.prayer_name == PrayerName.MAGHRIB:
                status.maghrib = log.status
            elif log.prayer_name == PrayerName.ISHA:
                status.isha = log.status
                
        return status

    def get_consistency_metrics(self, user_id: str, today: date_type) -> ConsistencyMetrics:
        start_date = today - timedelta(days=29)
        logs = self._repository.get_prayer_logs_for_date_range(user_id, start_date, today)
        
        days_map: dict[date_type, set[PrayerName]] = {}
        total_prayers = 0
        
        for log in logs:
            # We count COMPLETED and EXCUSED as successful for habit tracking
            if log.status in (PrayerStatus.COMPLETED, PrayerStatus.EXCUSED):
                if log.date not in days_map:
                    days_map[log.date] = set()
                days_map[log.date].add(log.prayer_name)
                total_prayers += 1
                
        completed_days = 0
        for d in range(30):
            d_date = start_date + timedelta(days=d)
            # 5 prayers completed
            if d_date in days_map and len(days_map[d_date]) == 5:
                completed_days += 1
                
        return ConsistencyMetrics(
            days_completed_last_30=completed_days,
            total_prayers_logged_last_30=total_prayers
        )

    def log_fasting(self, user_id: str, date: date_type, fasting_type: str) -> dict:
        return self._repository.log_fasting(user_id, date, fasting_type)

    def get_fasting_status(self, user_id: str, date: date_type) -> dict:
        return self._repository.get_fasting_status(user_id, date)

