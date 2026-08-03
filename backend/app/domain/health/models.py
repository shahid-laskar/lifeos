from pydantic import BaseModel
from datetime import date as date_type
from datetime import datetime

# ── Sleep ─────────────────────────────────────────────────────────────

class SleepLogBase(BaseModel):
    date: date_type
    sleep_time: datetime | None = None
    wake_time: datetime | None = None
    quality: int | None = None
    notes: str | None = None

class SleepLogCreate(SleepLogBase):
    pass

class SleepLogResponse(SleepLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# ── Exercise ──────────────────────────────────────────────────────────

class ExerciseLogBase(BaseModel):
    date: date_type
    exercise_type: str
    duration_minutes: int
    intensity: str | None = None
    notes: str | None = None

class ExerciseLogCreate(ExerciseLogBase):
    pass

class ExerciseLogResponse(ExerciseLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# ── Energy ────────────────────────────────────────────────────────────

class EnergyLogBase(BaseModel):
    date: date_type
    energy_level: int
    mood: str | None = None
    notes: str | None = None

class EnergyLogCreate(EnergyLogBase):
    pass

class EnergyLogResponse(EnergyLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
