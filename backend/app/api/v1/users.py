"""
User profile endpoints.

Includes the onboarding-status endpoint described in
024_Onboarding_Framework.md ("Progress Indicators", "Can onboarding be
resumed?") - computed once here so every client (web/PWA/RN) renders
identical progress without re-implementing the logic.
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_user_service
from app.domain.user.entities import UserRecord
from app.domain.user.models import (
    OnboardingStatusResponse,
    UserProfileResponse,
    UserProfileUpdateRequest,
)
from app.domain.user.service import UserService

router = APIRouter(prefix="/users", tags=["users"])


def _to_profile_response(user: UserRecord) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        preferred_language=user.preferred_language,
        country=user.country,
        timezone=user.timezone,
        latitude=user.latitude,
        longitude=user.longitude,
        prayer_calculation_method=user.prayer_calculation_method,
        asr_method=user.asr_method,
        goals=user.goals,
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
) -> UserProfileResponse:
    return _to_profile_response(current_user)


@router.patch("/me/profile", response_model=UserProfileResponse)
def update_my_profile(
    request: UserProfileUpdateRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserProfileResponse:
    updated = user_service.update_profile(
        user_id=current_user.id,
        country=request.country,
        timezone_name=request.timezone,
        latitude=request.latitude,
        longitude=request.longitude,
        prayer_calculation_method=request.prayer_calculation_method,
        asr_method=request.asr_method,
        goals=request.goals,
        preferred_language=request.preferred_language,
    )
    return _to_profile_response(updated)


@router.get("/me/onboarding-status", response_model=OnboardingStatusResponse)
def get_onboarding_status(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
) -> OnboardingStatusResponse:
    location_set = (
        current_user.country is not None 
        and current_user.timezone is not None
        and current_user.latitude is not None
        and current_user.longitude is not None
    )
    prayer_preferences_set = (
        current_user.prayer_calculation_method is not None and current_user.asr_method is not None
    )
    goals_set = len(current_user.goals) > 0

    return OnboardingStatusResponse(
        location_set=location_set,
        prayer_preferences_set=prayer_preferences_set,
        goals_set=goals_set,
        # First Meaningful Outcome (024): a personalised prayer schedule can
        # be shown once we know where the user is and how they want prayer
        # times calculated - goals are helpful but not required for this.
        first_meaningful_outcome_available=location_set and prayer_preferences_set,
    )


@router.get("/export")
def export_data(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
) -> dict:
    """
    Returns user data as JSON. 
    In the future, this can be expanded to include all associated records (prayer logs, etc).
    """
    profile = _to_profile_response(current_user)
    return {
        "profile": profile.model_dump(),
        "exported_at": current_user.updated_at or current_user.created_at
    }
