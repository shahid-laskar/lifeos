"""
SQLAlchemy implementation of QuranRepository.

Bridges the ORM layer (infrastructure) with the domain layer (quran/entities.py).
The domain service (quran/service.py) never sees ORM models.
"""
from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.domain.quran.entities import QuranBookmark, QuranReadingProgress
from app.infrastructure.orm_models import QuranBookmarkORM, QuranReadingProgressORM


# ── helpers ────────────────────────────────────────────────────────────────────

def _bookmark_to_record(row: QuranBookmarkORM) -> QuranBookmark:
    return QuranBookmark(
        id=row.id,
        user_id=row.user_id,
        surah_number=row.surah_number,
        ayah_number=row.ayah_number,
        note=row.note,
        created_at=row.created_at,
    )


def _progress_to_record(row: QuranReadingProgressORM) -> QuranReadingProgress:
    return QuranReadingProgress(
        id=row.id,
        user_id=row.user_id,
        surah_number=row.surah_number,
        last_ayah_number=row.last_ayah_number,
        updated_at=row.updated_at,
    )


# ── repository ─────────────────────────────────────────────────────────────────

class SqlAlchemyQuranRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    # ── Bookmarks ──────────────────────────────────────────────────────────────

    def add_bookmark(self, bookmark: QuranBookmark) -> QuranBookmark:
        row = self._session.get(QuranBookmarkORM, bookmark.id)
        if row is None:
            row = QuranBookmarkORM()
            self._session.add(row)

        row.id = bookmark.id
        row.user_id = bookmark.user_id
        row.surah_number = bookmark.surah_number
        row.ayah_number = bookmark.ayah_number
        row.note = bookmark.note
        row.created_at = bookmark.created_at

        self._session.commit()
        self._session.refresh(row)
        return _bookmark_to_record(row)

    def remove_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> bool:
        row = (
            self._session.query(QuranBookmarkORM)
            .filter(
                and_(
                    QuranBookmarkORM.user_id == user_id,
                    QuranBookmarkORM.surah_number == surah_number,
                    QuranBookmarkORM.ayah_number == ayah_number,
                )
            )
            .first()
        )
        if row is None:
            return False
        self._session.delete(row)
        self._session.commit()
        return True

    def get_bookmarks(self, user_id: str) -> list[QuranBookmark]:
        rows = (
            self._session.query(QuranBookmarkORM)
            .filter(QuranBookmarkORM.user_id == user_id)
            .order_by(QuranBookmarkORM.surah_number, QuranBookmarkORM.ayah_number)
            .all()
        )
        return [_bookmark_to_record(r) for r in rows]

    def get_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> QuranBookmark | None:
        row = (
            self._session.query(QuranBookmarkORM)
            .filter(
                and_(
                    QuranBookmarkORM.user_id == user_id,
                    QuranBookmarkORM.surah_number == surah_number,
                    QuranBookmarkORM.ayah_number == ayah_number,
                )
            )
            .first()
        )
        return _bookmark_to_record(row) if row else None

    # ── Reading progress ───────────────────────────────────────────────────────

    def upsert_reading_progress(
        self, progress: QuranReadingProgress
    ) -> QuranReadingProgress:
        row = self._session.get(QuranReadingProgressORM, progress.id)
        if row is None:
            row = QuranReadingProgressORM()
            self._session.add(row)

        row.id = progress.id
        row.user_id = progress.user_id
        row.surah_number = progress.surah_number
        row.last_ayah_number = progress.last_ayah_number
        row.updated_at = progress.updated_at

        self._session.commit()
        self._session.refresh(row)
        return _progress_to_record(row)

    def get_reading_progress(
        self, user_id: str, surah_number: int
    ) -> QuranReadingProgress | None:
        row = (
            self._session.query(QuranReadingProgressORM)
            .filter(
                and_(
                    QuranReadingProgressORM.user_id == user_id,
                    QuranReadingProgressORM.surah_number == surah_number,
                )
            )
            .first()
        )
        return _progress_to_record(row) if row else None

    def get_all_reading_progress(self, user_id: str) -> list[QuranReadingProgress]:
        rows = (
            self._session.query(QuranReadingProgressORM)
            .filter(QuranReadingProgressORM.user_id == user_id)
            .order_by(QuranReadingProgressORM.surah_number)
            .all()
        )
        return [_progress_to_record(r) for r in rows]
