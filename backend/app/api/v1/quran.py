"""
Qur'an API router.

Per 062_API_Architecture.md: this router represents a business capability
("quran"), contains no business logic, and only validates, delegates to the
domain service, and shapes the response.

All endpoints are read-only for text; bookmarks and reading progress
are user-specific and require authentication.

No AI involvement (ADR-007, Article 8).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_quran_service
from app.domain.user.entities import UserRecord
from app.domain.quran.service import (
    AyahOutOfRangeError,
    BookmarkNotFoundError,
    QuranService,
    SurahNotFoundError,
)
from app.domain.quran.models import (
    MemorisationMarkRequest,
    MemorisationResponse,
    TafsirResponse,
    BookmarkRequest,
    BookmarkResponse,
    AyahResponse,
    QuranWeeklySummaryResponse,
    ReadingProgressRequest,
    ReadingProgressResponse,
    SurahResponse,
    SurahAyahsResponse,
)

router = APIRouter(prefix="/quran", tags=["quran"])

@router.post("/memorisation/mark", response_model=MemorisationResponse)
def mark_memorisation(
    request: MemorisationMarkRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).date()
    record = quran_service.mark_memorisation(
        current_user.id,
        request.surah_number,
        request.ayah_number,
        request.quality,
        now
    )
    return MemorisationResponse(
        id=record.id,
        surah_number=record.surah_number,
        ayah_number=record.ayah_number,
        status=record.status,
        next_review=record.next_review
    )

@router.get("/memorisation/today-review", response_model=list[MemorisationResponse])
def get_today_review(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).date()
    records = quran_service.get_memorisation_review_queue(current_user.id, now)
    return [
        MemorisationResponse(
            id=r.id,
            surah_number=r.surah_number,
            ayah_number=r.ayah_number,
            status=r.status,
            next_review=r.next_review
        ) for r in records
    ]

from pydantic import BaseModel

class MemorisationProgressResponse(BaseModel):
    surah_number: int
    ayahs_memorised: list[int]
    completion_percentage: float

@router.get("/memorisation/progress", response_model=list[MemorisationProgressResponse])
def get_memorisation_progress(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
):
    progress = quran_service.get_memorisation_progress(current_user.id)
    return [
        MemorisationProgressResponse(
            surah_number=p["surah_number"],
            ayahs_memorised=p["ayahs_memorised"],
            completion_percentage=p["completion_percentage"]
        ) for p in progress
    ]

@router.get("/surahs/{surah_number}/ayahs/{ayah_number}/tafsir", response_model=TafsirResponse)
def get_tafsir(
    surah_number: int,
    ayah_number: int,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)]
):
    res = quran_service.get_tafsir(surah_number, ayah_number)
    return TafsirResponse(**res)



# ── Surah listing & info ────────────────────────────────────────────────────────


@router.get("/surahs", response_model=list[SurahResponse])
def list_surahs(
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> list[SurahResponse]:
    """Return the complete ordered list of all 114 surahs with metadata.

    Does not require authentication — the Qur'an is public.
    """
    return [
        SurahResponse(
            number=s.number,
            arabic_name=s.arabic_name,
            transliterated_name=s.transliterated_name,
            meaning=s.meaning,
            ayah_count=s.ayah_count,
            revelation_type=s.revelation_type.value,
        )
        for s in quran_service.list_surahs()
    ]


@router.get("/surahs/{surah_number}", response_model=SurahResponse)
def get_surah(
    surah_number: int,
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> SurahResponse:
    """Return metadata for a specific surah by number (1–114)."""
    try:
        s = quran_service.get_surah(surah_number)
    except SurahNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return SurahResponse(
        number=s.number,
        arabic_name=s.arabic_name,
        transliterated_name=s.transliterated_name,
        meaning=s.meaning,
        ayah_count=s.ayah_count,
        revelation_type=s.revelation_type.value,
    )


@router.get("/surahs/{surah_number}/ayahs", response_model=SurahAyahsResponse)
def get_surah_ayahs(
    surah_number: int,
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> SurahAyahsResponse:
    """Return verbatim Arabic Uthmani ayahs from the bundled Tanzil text.

    This is public content and does not require authentication. Keeping the
    text behind the application API prevents third parties from observing a
    user's reading requests.
    """
    try:
        ayahs = quran_service.get_ayahs(surah_number)
    except SurahNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return SurahAyahsResponse(
        surah_number=surah_number,
        ayahs=[
            AyahResponse(number_in_surah=ayah.number_in_surah, text=ayah.text)
            for ayah in ayahs
        ],
    )


# ── Bookmarks ───────────────────────────────────────────────────────────────────


@router.get("/bookmarks", response_model=list[BookmarkResponse])
def list_bookmarks(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> list[BookmarkResponse]:
    """Return all bookmarks for the authenticated user, ordered by surah/ayah."""
    bookmarks = quran_service.list_bookmarks(current_user.id)
    return [
        BookmarkResponse(
            id=b.id,
            surah_number=b.surah_number,
            ayah_number=b.ayah_number,
            note=b.note,
            created_at=b.created_at,
        )
        for b in bookmarks
    ]


@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def add_bookmark(
    request: BookmarkRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> BookmarkResponse:
    """Add (or update) a bookmark on a specific ayah."""
    try:
        b = quran_service.add_bookmark(
            user_id=current_user.id,
            surah_number=request.surah_number,
            ayah_number=request.ayah_number,
            note=request.note,
        )
    except SurahNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AyahOutOfRangeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return BookmarkResponse(
        id=b.id,
        surah_number=b.surah_number,
        ayah_number=b.ayah_number,
        note=b.note,
        created_at=b.created_at,
    )


@router.delete(
    "/bookmarks/{surah_number}/{ayah_number}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_bookmark(
    surah_number: int,
    ayah_number: int,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> None:
    """Remove a bookmark from a specific ayah."""
    try:
        quran_service.remove_bookmark(current_user.id, surah_number, ayah_number)
    except BookmarkNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ── Reading progress ─────────────────────────────────────────────────────────────


@router.get("/reading-progress", response_model=list[ReadingProgressResponse])
def list_reading_progress(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> list[ReadingProgressResponse]:
    """Return reading progress for all surahs the user has interacted with."""
    records = quran_service.get_all_reading_progress(current_user.id)
    return [
        ReadingProgressResponse(
            surah_number=r.surah_number,
            last_ayah_number=r.last_ayah_number,
            updated_at=r.updated_at,
        )
        for r in records
    ]


@router.get("/reading-progress/{surah_number}", response_model=ReadingProgressResponse)
def get_reading_progress(
    surah_number: int,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> ReadingProgressResponse:
    """Return the user's last-read position in a specific surah."""
    try:
        record = quran_service.get_reading_progress(current_user.id, surah_number)
    except SurahNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"No reading progress recorded for surah {surah_number}.",
        )
    return ReadingProgressResponse(
        surah_number=record.surah_number,
        last_ayah_number=record.last_ayah_number,
        updated_at=record.updated_at,
    )


@router.put("/reading-progress", response_model=ReadingProgressResponse)
def update_reading_progress(
    request: ReadingProgressRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> ReadingProgressResponse:
    """Record (or update) the user's last-read position in a surah.

    This is a simple last-read tracker — not a streak counter (ADR-003,
    Article 2: Consistency over Intensity).
    """
    try:
        record = quran_service.update_reading_progress(
            user_id=current_user.id,
            surah_number=request.surah_number,
            last_ayah_number=request.last_ayah_number,
        )
    except SurahNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AyahOutOfRangeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return ReadingProgressResponse(
        surah_number=record.surah_number,
        last_ayah_number=record.last_ayah_number,
        updated_at=record.updated_at,
    )


@router.get("/reading-progress/summary/weekly", response_model=QuranWeeklySummaryResponse)
def get_weekly_reading_summary(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
) -> QuranWeeklySummaryResponse:
    """Return a weekly summary of the user's reading progress.
    
    This calculates reading consistency (e.g., 'Read 3 surahs over 2 days in the past 7 days') 
    without maintaining fragile streak counters or tracking invasive session duration metrics,
    aligning with Article 2 (Consistency over Intensity).
    """
    summary = quran_service.get_weekly_summary(current_user.id)
    return QuranWeeklySummaryResponse(
        surahs_read_last_7_days=summary["surahs_read_last_7_days"],
        active_days_last_7_days=summary["active_days_last_7_days"],
    )
