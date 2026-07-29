"""
Framework-agnostic User entity.

Per 063_Domain_Driven_Design.md, this is the domain's own representation of
a user - it knows nothing about SQLAlchemy, FastAPI, or any other
infrastructure detail. The infrastructure layer
(app/infrastructure/user_repository_sqlalchemy.py) is responsible for
translating between this and the persistence model.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.user.goals import OnboardingGoal


@dataclass
class UserRecord:
    id: str
    email: str
    hashed_password: str
    is_active: bool
    terms_accepted_at: datetime
    created_at: datetime
    updated_at: datetime

    preferred_language: str = "en"
    country: str | None = None            # ISO 3166-1 alpha-2, e.g. "GB"
    timezone: str | None = None           # IANA name, e.g. "Europe/London"
    latitude: float | None = None
    longitude: float | None = None
    prayer_calculation_method: CalculationMethod | None = None
    asr_method: AsrMethod | None = None
    goals: list[OnboardingGoal] = field(default_factory=list)


@dataclass
class PasswordResetToken:
    id: str
    user_id: str
    hashed_token: str
    expires_at: datetime
    created_at: datetime

