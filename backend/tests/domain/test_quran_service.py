"""
Unit tests for the Qur'an domain service.

Uses an in-memory fake repository so these tests run without a database.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterator

import pytest

from app.domain.quran.entities import QuranBookmark, QuranReadingProgress
from app.domain.quran.service import (
    AyahOutOfRangeError,
    BookmarkNotFoundError,
    QuranService,
    SurahNotFoundError,
)


# ── Fake in-memory repository ─────────────────────────────────────────────────


class FakeQuranRepository:
    def __init__(self) -> None:
        self._bookmarks: dict[str, QuranBookmark] = {}       # id → bookmark
        self._progress: dict[tuple, QuranReadingProgress] = {}  # (user,surah) → progress

    def add_bookmark(self, bookmark: QuranBookmark) -> QuranBookmark:
        self._bookmarks[bookmark.id] = bookmark
        return bookmark

    def remove_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> bool:
        for bid, bm in list(self._bookmarks.items()):
            if (
                bm.user_id == user_id
                and bm.surah_number == surah_number
                and bm.ayah_number == ayah_number
            ):
                del self._bookmarks[bid]
                return True
        return False

    def get_bookmarks(self, user_id: str) -> list[QuranBookmark]:
        return [b for b in self._bookmarks.values() if b.user_id == user_id]

    def get_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> QuranBookmark | None:
        for bm in self._bookmarks.values():
            if (
                bm.user_id == user_id
                and bm.surah_number == surah_number
                and bm.ayah_number == ayah_number
            ):
                return bm
        return None

    def upsert_reading_progress(
        self, progress: QuranReadingProgress
    ) -> QuranReadingProgress:
        self._progress[(progress.user_id, progress.surah_number)] = progress
        return progress

    def get_reading_progress(
        self, user_id: str, surah_number: int
    ) -> QuranReadingProgress | None:
        return self._progress.get((user_id, surah_number))

    def get_all_reading_progress(self, user_id: str) -> list[QuranReadingProgress]:
        return [p for (uid, _), p in self._progress.items() if uid == user_id]


@pytest.fixture
def service() -> QuranService:
    return QuranService(FakeQuranRepository())


USER = "user-001"


# ── Surah listing / validation ─────────────────────────────────────────────────


def test_list_surahs_returns_114(service: QuranService) -> None:
    surahs = service.list_surahs()
    assert len(surahs) == 114


def test_get_al_fatiha(service: QuranService) -> None:
    s = service.get_surah(1)
    assert s.number == 1
    assert s.ayah_count == 7
    assert s.transliterated_name == "Al-Fatihah"


def test_get_invalid_surah_raises(service: QuranService) -> None:
    with pytest.raises(SurahNotFoundError):
        service.get_surah(115)


def test_get_surah_zero_raises(service: QuranService) -> None:
    with pytest.raises(SurahNotFoundError):
        service.get_surah(0)


# ── Bookmarks ───────────────────────────────────────────────────────────────────


def test_add_bookmark_happy_path(service: QuranService) -> None:
    bm = service.add_bookmark(USER, surah_number=1, ayah_number=1)
    assert bm.user_id == USER
    assert bm.surah_number == 1
    assert bm.ayah_number == 1
    assert bm.note is None


def test_add_bookmark_with_note(service: QuranService) -> None:
    bm = service.add_bookmark(USER, surah_number=2, ayah_number=255, note="Ayat Al-Kursi")
    assert bm.note == "Ayat Al-Kursi"


def test_add_bookmark_is_idempotent(service: QuranService) -> None:
    """Adding the same bookmark twice returns the existing one (no duplicate)."""
    bm1 = service.add_bookmark(USER, surah_number=1, ayah_number=1)
    bm2 = service.add_bookmark(USER, surah_number=1, ayah_number=1)
    assert bm1.id == bm2.id
    assert len(service.list_bookmarks(USER)) == 1


def test_add_bookmark_invalid_ayah_raises(service: QuranService) -> None:
    # Al-Fatihah only has 7 ayahs
    with pytest.raises(AyahOutOfRangeError):
        service.add_bookmark(USER, surah_number=1, ayah_number=8)


def test_add_bookmark_invalid_surah_raises(service: QuranService) -> None:
    with pytest.raises(SurahNotFoundError):
        service.add_bookmark(USER, surah_number=115, ayah_number=1)


def test_remove_bookmark(service: QuranService) -> None:
    service.add_bookmark(USER, surah_number=36, ayah_number=1)
    service.remove_bookmark(USER, surah_number=36, ayah_number=1)
    assert service.list_bookmarks(USER) == []


def test_remove_nonexistent_bookmark_raises(service: QuranService) -> None:
    with pytest.raises(BookmarkNotFoundError):
        service.remove_bookmark(USER, surah_number=1, ayah_number=1)


def test_bookmarks_are_user_scoped(service: QuranService) -> None:
    service.add_bookmark("user-A", surah_number=1, ayah_number=1)
    service.add_bookmark("user-B", surah_number=2, ayah_number=1)
    assert len(service.list_bookmarks("user-A")) == 1
    assert len(service.list_bookmarks("user-B")) == 1
    assert service.list_bookmarks("user-C") == []


# ── Reading progress ─────────────────────────────────────────────────────────────


def test_update_reading_progress(service: QuranService) -> None:
    p = service.update_reading_progress(USER, surah_number=18, last_ayah_number=10)
    assert p.surah_number == 18
    assert p.last_ayah_number == 10


def test_reading_progress_upserts(service: QuranService) -> None:
    service.update_reading_progress(USER, surah_number=2, last_ayah_number=50)
    p = service.update_reading_progress(USER, surah_number=2, last_ayah_number=100)
    assert p.last_ayah_number == 100
    assert len(service.get_all_reading_progress(USER)) == 1


def test_reading_progress_out_of_range_raises(service: QuranService) -> None:
    # Al-Baqarah has 286 ayahs
    with pytest.raises(AyahOutOfRangeError):
        service.update_reading_progress(USER, surah_number=2, last_ayah_number=287)


def test_get_reading_progress_no_record_returns_none(service: QuranService) -> None:
    assert service.get_reading_progress(USER, surah_number=1) is None


def test_get_reading_progress_invalid_surah_raises(service: QuranService) -> None:
    with pytest.raises(SurahNotFoundError):
        service.get_reading_progress(USER, surah_number=200)


def test_no_engagement_fields_on_quran_entities(service: QuranService) -> None:
    """ADR-003 / Article 2: no streak-style fields should appear on domain entities."""
    bm = service.add_bookmark(USER, surah_number=112, ayah_number=1)
    bm_fields = {f for f in vars(bm)}
    assert "streak" not in bm_fields
    assert "session_duration" not in bm_fields

    p = service.update_reading_progress(USER, surah_number=112, last_ayah_number=1)
    p_fields = {f for f in vars(p)}
    assert "streak" not in p_fields
