"""
User domain API schemas.

The split between UserRegisterRequest (minimal) and UserProfileUpdateRequest
(everything else, all optional) is a direct encoding of ADR-004 and
024_Onboarding_Framework.md's progressive-disclosure principle: the type
system itself prevents registration from silently growing extra required
fields over time.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.user.goals import OnboardingGoal

MIN_PASSWORD_LENGTH = 8


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH)
    terms_accepted: bool
    preferred_language: str = Field("en", min_length=2, max_length=10)

    @field_validator("terms_accepted")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError(
                "terms_accepted must be true - registration cannot proceed "
                "without explicit, informed consent (Article 9 / 033_Trust_and_Safety_UX.md)."
            )
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfileUpdateRequest(BaseModel):
    """Every field optional - profile completion is progressive, never
    forced in one step. See 024_Onboarding_Framework.md 'Step 7 - Personal
    Context' and 'Step 8 - Prayer Configuration'."""

    country: str | None = Field(None, min_length=2, max_length=2)
    timezone: str | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    prayer_calculation_method: CalculationMethod | None = None
    asr_method: AsrMethod | None = None
    goals: list[OnboardingGoal] | None = None
    preferred_language: str | None = Field(None, min_length=2, max_length=10)


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    preferred_language: str
    country: str | None
    timezone: str | None
    latitude: float | None
    longitude: float | None
    prayer_calculation_method: CalculationMethod | None
    asr_method: AsrMethod | None
    goals: list[OnboardingGoal]
    created_at: datetime


class OnboardingStatusResponse(BaseModel):
    """Lets any client (web/PWA/RN) render onboarding progress without
    re-implementing this logic per platform - single source of truth here.
    See 024_Onboarding_Framework.md 'Progress Indicators' /
    'Can onboarding be resumed?'."""

    account_created: bool = True  # if this response exists, the account exists
    location_set: bool
    prayer_preferences_set: bool
    goals_set: bool
    first_meaningful_outcome_available: bool = Field(
        ...,
        description=(
            "True once enough profile info exists to show a personalised "
            "prayer schedule - the app's First Meaningful Outcome per "
            "024_Onboarding_Framework.md."
        ),
    )
