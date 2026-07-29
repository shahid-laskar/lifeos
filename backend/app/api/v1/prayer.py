"""
Prayer times API.

Per 062_API_Architecture.md: this router represents a business capability
("prayer times"), hides implementation details, and contains no business
logic itself - it only validates, delegates to the domain service, and
shapes the response.
"""
from fastapi import APIRouter, HTTPException

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
