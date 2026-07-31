from __future__ import annotations

from datetime import date as date_type
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.domain.habit.entities import PrayerLogRecord, PrayerName, PrayerStatus
from app.infrastructure.orm_models import PrayerLogORM

def _to_record(row: PrayerLogORM) -> PrayerLogRecord:
    return PrayerLogRecord(
        id=row.id,
        user_id=row.user_id,
        date=row.date,
        prayer_name=PrayerName(row.prayer_name),
        status=PrayerStatus(row.status),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )

def _apply_record_to_row(record: PrayerLogRecord, row: PrayerLogORM) -> None:
    row.id = record.id
    row.user_id = record.user_id
    row.date = record.date
    row.prayer_name = record.prayer_name.value
    row.status = record.status.value
    row.created_at = record.created_at
    row.updated_at = record.updated_at

class SqlAlchemyHabitRepository:
    def __init__(self, session: Session):
        self._session = session

    def log_prayer(self, record: PrayerLogRecord) -> PrayerLogRecord:
        row = self._session.get(PrayerLogORM, record.id)
        if row is None:
            row = PrayerLogORM()
            self._session.add(row)
        
        _apply_record_to_row(record, row)
        self._session.commit()
        self._session.refresh(row)
        return _to_record(row)

    def get_prayer_logs_for_date_range(
        self, user_id: str, start_date: date_type, end_date: date_type
    ) -> list[PrayerLogRecord]:
        rows = (
            self._session.query(PrayerLogORM)
            .filter(
                and_(
                    PrayerLogORM.user_id == user_id,
                    PrayerLogORM.date >= start_date,
                    PrayerLogORM.date <= end_date,
                )
            )
            .all()
        )
        return [_to_record(row) for row in rows]

    def get_prayer_log(
        self, user_id: str, date: date_type, prayer_name: PrayerName
    ) -> PrayerLogRecord | None:
        row = (
            self._session.query(PrayerLogORM)
            .filter(
                and_(
                    PrayerLogORM.user_id == user_id,
                    PrayerLogORM.date == date,
                    PrayerLogORM.prayer_name == prayer_name.value,
                )
            )
            .first()
        )
        return _to_record(row) if row else None

    def log_fasting(self, user_id: str, date: date_type, fasting_type: str) -> dict:
        from app.infrastructure.orm_models import FastingLogORM
        import uuid
        from datetime import datetime, timezone

        row = (
            self._session.query(FastingLogORM)
            .filter(and_(FastingLogORM.user_id == user_id, FastingLogORM.date == date))
            .first()
        )
        if not row:
            row = FastingLogORM(
                id=str(uuid.uuid4()),
                user_id=user_id,
                date=date,
                type=fasting_type,
                created_at=datetime.now(timezone.utc),
            )
            self._session.add(row)
        else:
            row.type = fasting_type
        self._session.commit()
        return {"id": row.id, "date": str(row.date), "type": row.type}

    def get_fasting_status(self, user_id: str, date: date_type) -> dict:
        from app.infrastructure.orm_models import FastingLogORM

        row = (
            self._session.query(FastingLogORM)
            .filter(and_(FastingLogORM.user_id == user_id, FastingLogORM.date == date))
            .first()
        )
        if not row:
            return {"date": str(date), "fasting": False, "type": None}
        return {"date": str(row.date), "fasting": row.type != "none", "type": row.type}
