"""SQLAlchemy implementation of HadithBookmarkRepository."""
from __future__ import annotations

from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.domain.hadith.entities import HadithBookmark
from app.infrastructure.orm_models import HadithBookmarkORM


def _to_entity(row: HadithBookmarkORM) -> HadithBookmark:
    return HadithBookmark(
        id=row.id,
        user_id=row.user_id,
        hadith_id=row.hadith_id,
        note=row.note,
        created_at=row.created_at,
    )


class HadithBookmarkRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, bookmark: HadithBookmark) -> HadithBookmark:
        row = self._session.get(HadithBookmarkORM, bookmark.id)
        if row is None:
            row = HadithBookmarkORM(id=bookmark.id)
            self._session.add(row)
        row.user_id = bookmark.user_id
        row.hadith_id = bookmark.hadith_id
        row.note = bookmark.note
        row.created_at = bookmark.created_at
        self._session.commit()
        self._session.refresh(row)
        return _to_entity(row)

    def remove(self, user_id: str, hadith_id: str) -> bool:
        result = self._session.execute(
            delete(HadithBookmarkORM).where(
                HadithBookmarkORM.user_id == user_id,
                HadithBookmarkORM.hadith_id == hadith_id,
            )
        )
        self._session.commit()
        return (result.rowcount or 0) > 0

    def list_for_user(self, user_id: str) -> list[HadithBookmark]:
        rows = self._session.scalars(
            select(HadithBookmarkORM)
            .where(HadithBookmarkORM.user_id == user_id)
            .order_by(HadithBookmarkORM.created_at.desc())
        ).all()
        return [_to_entity(r) for r in rows]

    def get(self, user_id: str, hadith_id: str) -> HadithBookmark | None:
        row = self._session.scalars(
            select(HadithBookmarkORM).where(
                HadithBookmarkORM.user_id == user_id,
                HadithBookmarkORM.hadith_id == hadith_id,
            )
        ).first()
        return _to_entity(row) if row else None
