from __future__ import annotations

import uuid
from datetime import date as date_type, datetime, timedelta, timezone

from app.domain.habit.entities import PrayerLogRecord, PrayerName, PrayerStatus, PrayerJournalRecord
from app.domain.habit.models import ConsistencyMetrics, DailyPrayerStatus, PrayerInsightsResponse
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

    def log_prayer_journal(
        self, user_id: str, date: date_type, prayer_name: PrayerName, khushoo_rating: int, notes: str | None, distractions: str | None
    ) -> PrayerJournalRecord:
        now = datetime.now(timezone.utc)
        existing = self._repository.get_prayer_journal(user_id, date, prayer_name)
        if existing:
            existing.khushoo_rating = khushoo_rating
            existing.notes = notes
            existing.distractions = distractions
            existing.updated_at = now
            return self._repository.log_prayer_journal(existing)

        record = PrayerJournalRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            date=date,
            prayer_name=prayer_name,
            khushoo_rating=khushoo_rating,
            notes=notes,
            distractions=distractions,
            created_at=now,
            updated_at=now,
        )
        return self._repository.log_prayer_journal(record)

    def get_prayer_journal(self, user_id: str, date: date_type, prayer_name: PrayerName) -> PrayerJournalRecord | None:
        return self._repository.get_prayer_journal(user_id, date, prayer_name)

    def get_prayer_journals(self, user_id: str, start_date: date_type, end_date: date_type) -> list[PrayerJournalRecord]:
        return self._repository.get_prayer_journals_for_date_range(user_id, start_date, end_date)

    def get_prayer_insights(self, user_id: str, today: date_type) -> PrayerInsightsResponse:
        start_date = today - timedelta(days=29)
        journals = self._repository.get_prayer_journals_for_date_range(user_id, start_date, today)
        
        if not journals:
            return PrayerInsightsResponse(
                average_khushoo=0.0,
                common_distractions=[],
                encouragement="Start journaling your prayers to see insights."
            )
            
        avg_khushoo = sum(j.khushoo_rating for j in journals) / len(journals)
        distractions = []
        for j in journals:
            if j.distractions:
                distractions.extend([d.strip() for d in j.distractions.split(",") if d.strip()])
                
        # Get top 3 distractions
        from collections import Counter
        top_distractions = [d for d, _ in Counter(distractions).most_common(3)]
        
        return PrayerInsightsResponse(
            average_khushoo=round(avg_khushoo, 1),
            common_distractions=top_distractions,
            encouragement="May Allah accept your prayers and grant you khushoo."
        )


