"""
Prayer times API.

Per 062_API_Architecture.md: this router represents a business capability
("prayer times"), hides implementation details, and contains no business
logic itself - it only validates, delegates to the domain service, and
shapes the response.
"""
from datetime import date as date_type, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.domain.user.entities import UserRecord
from app.domain.prayer.models import PrayerTimeRequest, PrayerTimeResponse
from app.domain.prayer.service import calculate_prayer_times

router = APIRouter(prefix="/prayer", tags=["prayer"])


@router.post("/times", response_model=PrayerTimeResponse)
def get_prayer_times(request: PrayerTimeRequest) -> PrayerTimeResponse:
    """Calculate prayer times for a given location, date and method.

    Stateless: nothing is persisted. See Article 9 (Privacy Is Sacred) and
    ADR-003 in docs/decision-log.md.
    """
    try:
        return calculate_prayer_times(request)
    except ValueError as exc:
        # Per 032_Error_and_Recovery_Experience.md: explain what happened and
        # why, avoid technical jargon, never expose a raw stack trace.
        raise HTTPException(
            status_code=422,
            detail={
                "message": (
                    "Prayer times could not be calculated for this exact "
                    "location and date."
                ),
                "reason": str(exc),
                "suggested_action": (
                    "This can happen in polar regions during midnight sun or "
                    "polar night. Try a nearby lower-latitude location, or "
                    "check back for a future update supporting polar "
                    "calculation methods."
                ),
            },
        ) from exc


@router.get("/times/me", response_model=PrayerTimeResponse)
def get_my_prayer_times(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    date: date_type | None = Query(None, description="Date to calculate times for. Defaults to today in user's timezone."),
) -> PrayerTimeResponse:
    """Calculate prayer times for the current authenticated user based on their profile settings."""
    if current_user.latitude is None or current_user.longitude is None or current_user.timezone is None:
        raise HTTPException(
            status_code=400,
            detail="User profile is incomplete. Latitude, longitude, and timezone must be set to calculate prayer times.",
        )
    
    tz = ZoneInfo(current_user.timezone)
    target_date = date or datetime.now(tz).date()
    
    # Calculate timezone offset in hours for the specific date
    dt = datetime(target_date.year, target_date.month, target_date.day, tzinfo=tz)
    offset_hours = dt.utcoffset().total_seconds() / 3600.0

    request = PrayerTimeRequest(
        latitude=current_user.latitude,
        longitude=current_user.longitude,
        date=target_date,
        timezone_offset_hours=offset_hours,
        method=current_user.prayer_calculation_method or PrayerTimeRequest.model_fields["method"].default,
        asr_method=current_user.asr_method or PrayerTimeRequest.model_fields["asr_method"].default,
    )
    
    try:
        return calculate_prayer_times(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Prayer times could not be calculated for your location and date.",
                "reason": str(exc),
                "suggested_action": "Try updating your profile with a valid location or check back for future updates supporting your region."
            },
        ) from exc

