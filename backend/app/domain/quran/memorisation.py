
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional

@dataclass
class MemorisationRecord:
    id: str
    user_id: str
    surah_number: int
    ayah_number: int
    status: str
    last_reviewed: Optional[date]
    next_review: Optional[date]
    strength: int
    created_at: datetime
    updated_at: datetime

def calculate_next_review(strength: int, current_date: date, quality: int) -> tuple[int, date]:
    # Simplified spaced repetition algorithm
    if quality < 3:
        new_strength = 0
    else:
        new_strength = strength + 1
        
    interval = 1
    if new_strength == 1:
        interval = 1
    elif new_strength == 2:
        interval = 3
    elif new_strength > 2:
        interval = max(3, int(strength * 1.5))
        
    return new_strength, current_date + timedelta(days=interval)
