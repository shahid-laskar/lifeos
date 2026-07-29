"""
Request/response schemas for prayer time calculation.

Per Article 9 (Privacy Is Sacred): this endpoint is stateless by design -
location is supplied per-request and never persisted server-side unless the
caller is authenticated and has explicitly opted in to saving a "home
location" (a later feature, not implemented in this slice).
"""
from datetime import date as date_type

from pydantic import BaseModel, Field

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod


class PrayerTimeRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    date: date_type
    timezone_offset_hours: float = Field(
        ..., ge=-12, le=14, description="UTC offset in hours, e.g. 5.5 for IST"
    )
    method: CalculationMethod = CalculationMethod.MWL
    asr_method: AsrMethod = AsrMethod.STANDARD
    elevation_meters: float = Field(0.0, ge=0)


class PrayerTimes(BaseModel):
    fajr: str
    sunrise: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str


class PrayerTimeResponse(BaseModel):
    date: date_type
    latitude: float
    longitude: float
    method: CalculationMethod
    asr_method: AsrMethod
    times: PrayerTimes
    high_latitude_adjustment_applied: bool = Field(
        False,
        description=(
            "True if a high-latitude fallback rule was used because the sun "
            "does not reach the required angle below the horizon on this "
            "date/location (see 035_Internationalisation_and_Localisation.md)."
        ),
    )
