from __future__ import annotations

import enum
from dataclasses import dataclass
from datetime import date as date_type, datetime

class PrayerName(str, enum.Enum):
    FAJR = "fajr"
    DHUHR = "dhuhr"
    ASR = "asr"
    MAGHRIB = "maghrib"
    ISHA = "isha"

class PrayerStatus(str, enum.Enum):
    COMPLETED = "completed"
    MISSED = "missed"
    EXCUSED = "excused"

@dataclass
class PrayerLogRecord:
    id: str
    user_id: str
    date: date_type
    prayer_name: PrayerName
    status: PrayerStatus
    created_at: datetime
    updated_at: datetime
