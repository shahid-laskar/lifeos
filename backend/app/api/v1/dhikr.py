"""
Dhikr API router.

Per 062_API_Architecture.md: this router represents a business capability
("dhikr"), contains no business logic, and only validates, delegates to the
domain service, and shapes the response.

All endpoints are read-only for text; session logging requires authentication.

No AI involvement (ADR-008, Article 8).
"""
from typing import Annotated
from datetime import date as date_type, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_dhikr_service
from app.domain.user.entities import UserRecord
from app.domain.dhikr.service import (
    DhikrItemNotFoundError,
    DhikrService,
)
from app.domain.dhikr.entities import DhikrCategory
from app.domain.dhikr.models import (
    DhikrDailySummaryResponse,
    DhikrItemResponse,
    DhikrLogRequest,
    DhikrLogResponse,
)

router = APIRouter(prefix="/dhikr", tags=["dhikr"])


# ── Catalogue ───────────────────────────────────────────────────────────────


@router.get("/items", response_model=list[DhikrItemResponse])
def list_items(
    dhikr_service: Annotated[DhikrService, Depends(get_dhikr_service)],
    category: DhikrCategory | None = Query(None, description="Filter by category"),
) -> list[DhikrItemResponse]:
    """Return the curated list of adhkar.

    Does not require authentication — the adhkar catalogue is public.
    """
    return [
        DhikrItemResponse(
            id=i.id,
            category=i.category.value,
            arabic_text=i.arabic_text,
            transliteration=i.transliteration,
            meaning=i.meaning,
            recommended_count=i.recommended_count,
            source=i.source,
        )
        for i in dhikr_service.list_items(category)
    ]


@router.get("/items/{item_id}", response_model=DhikrItemResponse)
def get_item(
    item_id: str,
    dhikr_service: Annotated[DhikrService, Depends(get_dhikr_service)],
) -> DhikrItemResponse:
    """Return details for a specific dhikr item."""
    try:
        i = dhikr_service.get_item(item_id)
    except DhikrItemNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return DhikrItemResponse(
        id=i.id,
        category=i.category.value,
        arabic_text=i.arabic_text,
        transliteration=i.transliteration,
        meaning=i.meaning,
        recommended_count=i.recommended_count,
        source=i.source,
    )


# ── Logging ─────────────────────────────────────────────────────────────────


@router.post("/sessions", response_model=DhikrLogResponse, status_code=status.HTTP_201_CREATED)
def log_session(
    request: DhikrLogRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    dhikr_service: Annotated[DhikrService, Depends(get_dhikr_service)],
    date: date_type | None = Query(None, description="Date of the session. Defaults to today in user's timezone."),
) -> DhikrLogResponse:
    """Log a dhikr session."""
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set to log dhikr sessions.")
        
    tz = ZoneInfo(current_user.timezone)
    target_date = date or datetime.now(tz).date()

    try:
        log = dhikr_service.log_session(
            user_id=current_user.id,
            item_id=request.dhikr_item_id,
            count=request.count,
            date=target_date,
        )
    except DhikrItemNotFoundError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return DhikrLogResponse(
        id=log.id,
        dhikr_item_id=log.dhikr_item_id,
        category=log.category.value,
        count=log.count,
        date=log.date,
        logged_at=log.logged_at,
    )


@router.get("/summary", response_model=DhikrDailySummaryResponse)
def get_daily_summary(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    dhikr_service: Annotated[DhikrService, Depends(get_dhikr_service)],
    date: date_type | None = Query(None, description="Date for the summary. Defaults to today in user's timezone."),
) -> DhikrDailySummaryResponse:
    """Return the daily summary of dhikr sessions."""
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set to get dhikr summary.")
        
    tz = ZoneInfo(current_user.timezone)
    target_date = date or datetime.now(tz).date()

    return dhikr_service.get_daily_summary(current_user.id, target_date)
