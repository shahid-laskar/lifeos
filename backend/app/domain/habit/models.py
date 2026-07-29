from datetime import date as date_type
from pydantic import BaseModel, Field

from app.domain.habit.entities import PrayerName, PrayerStatus

class PrayerLogRequest(BaseModel):
    prayer_name: PrayerName
    status: PrayerStatus

class PrayerLogResponse(BaseModel):
    id: str
    date: date_type
    prayer_name: PrayerName
    status: PrayerStatus

class DailyPrayerStatus(BaseModel):
    date: date_type
    fajr: PrayerStatus | None = None
    dhuhr: PrayerStatus | None = None
    asr: PrayerStatus | None = None
    maghrib: PrayerStatus | None = None
    isha: PrayerStatus | None = None

class ConsistencyMetrics(BaseModel):
    days_completed_last_30: int = Field(..., description="Number of days in the last 30 days where all 5 prayers were completed (or excused).")
    total_prayers_logged_last_30: int = Field(..., description="Total prayers logged in the last 30 days.")
