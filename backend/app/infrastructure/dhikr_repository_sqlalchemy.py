"""
SQLAlchemy implementation of DhikrRepository.
"""
from __future__ import annotations

from datetime import date as date_type

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.domain.dhikr.entities import DhikrCategory, DhikrLog
from app.infrastructure.orm_models import DhikrLogORM


def _log_to_record(row: DhikrLogORM) -> DhikrLog:
    return DhikrLog(
        id=row.id,
        user_id=row.user_id,
        dhikr_item_id=row.dhikr_item_id,
        category=DhikrCategory(row.category),
        count=row.count,
        date=row.date,
        logged_at=row.logged_at,
    )


class SqlAlchemyDhikrRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add_log(self, log: DhikrLog) -> DhikrLog:
        row = DhikrLogORM(
            id=log.id,
            user_id=log.user_id,
            dhikr_item_id=log.dhikr_item_id,
            category=log.category.value,
            count=log.count,
            date=log.date,
            logged_at=log.logged_at,
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return _log_to_record(row)

    def get_logs_for_date(
        self, user_id: str, date: date_type, category: DhikrCategory | None = None
    ) -> list[DhikrLog]:
        query = self._session.query(DhikrLogORM).filter(
            and_(
                DhikrLogORM.user_id == user_id,
                DhikrLogORM.date == date,
            )
        )
        if category:
            query = query.filter(DhikrLogORM.category == category.value)

        rows = query.order_by(DhikrLogORM.logged_at).all()
        return [_log_to_record(r) for r in rows]
