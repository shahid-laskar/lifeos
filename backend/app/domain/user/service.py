"""
User domain service.

Per 063_Domain_Driven_Design.md, this holds the business rules for
registration, authentication, and profile updates. It depends only on the
UserRepository Protocol (not a concrete database), so it is fully unit
testable with an in-memory fake - see tests/domain/test_user_service.py.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.security import hash_password, verify_password
from app.domain.user.entities import UserRecord
from app.domain.user.goals import OnboardingGoal
from app.domain.user.models import UserRegisterRequest
from app.domain.user.repository import UserRepository
from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod


class EmailAlreadyRegisteredError(Exception):
    """Raised when attempting to register an email that already exists.
    Deliberately does not say whether it's the email or something else that
    matched, to avoid distinguishing user-enumeration behaviour beyond what
    is unavoidable at the registration step itself."""


class InvalidCredentialsError(Exception):
    """Raised for any login failure. Generic on purpose - per
    070_Backend_Security.md, never reveal whether the email or the password
    was the specific problem."""


class UserNotFoundError(Exception):
    pass


class UserService:
    def __init__(self, repository: UserRepository):
        self._repository = repository

    def register(self, request: UserRegisterRequest) -> UserRecord:
        existing = self._repository.get_by_email(request.email.lower())
        if existing is not None:
            raise EmailAlreadyRegisteredError()

        now = datetime.now(timezone.utc)
        record = UserRecord(
            id=str(uuid.uuid4()),
            email=request.email.lower(),
            hashed_password=hash_password(request.password),
            is_active=True,
            terms_accepted_at=now,
            created_at=now,
            updated_at=now,
            preferred_language=request.preferred_language,
        )
        return self._repository.create(record)

    def authenticate(self, email: str, password: str) -> UserRecord:
        user = self._repository.get_by_email(email.lower())
        if user is None or not user.is_active:
            raise InvalidCredentialsError()
        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user

    def get_by_id(self, user_id: str) -> UserRecord:
        user = self._repository.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError()
        return user

    def update_profile(
        self,
        user_id: str,
        *,
        country: str | None = None,
        timezone_name: str | None = None,
        prayer_calculation_method: CalculationMethod | None = None,
        asr_method: AsrMethod | None = None,
        goals: list[OnboardingGoal] | None = None,
        preferred_language: str | None = None,
    ) -> UserRecord:
        user = self.get_by_id(user_id)

        # Each field only overwritten if explicitly provided - progressive
        # profile completion, never silently reset by omission.
        if country is not None:
            user.country = country
        if timezone_name is not None:
            user.timezone = timezone_name
        if prayer_calculation_method is not None:
            user.prayer_calculation_method = prayer_calculation_method
        if asr_method is not None:
            user.asr_method = asr_method
        if goals is not None:
            user.goals = goals
        if preferred_language is not None:
            user.preferred_language = preferred_language

        user.updated_at = datetime.now(timezone.utc)
        return self._repository.update(user)
