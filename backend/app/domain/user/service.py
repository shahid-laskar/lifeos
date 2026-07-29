"""
User domain service.

Per 063_Domain_Driven_Design.md, this holds the business rules for
registration, authentication, and profile updates. It depends only on the
UserRepository Protocol (not a concrete database), so it is fully unit
testable with an in-memory fake - see tests/domain/test_user_service.py.
"""
from __future__ import annotations

import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password, verify_password
from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.user.email_service import EmailService
from app.domain.user.entities import PasswordResetToken, UserRecord
from app.domain.user.goals import OnboardingGoal
from app.domain.user.models import (
    UserProfileUpdateRequest,
    UserRegisterRequest,
)
from app.domain.user.repository import PasswordResetTokenRepository, UserRepository


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
    def __init__(
        self,
        repository: UserRepository,
        token_repository: PasswordResetTokenRepository | None = None,
        email_service: EmailService | None = None,
    ) -> None:
        self._repo = repository
        self._token_repo = token_repository
        self._email_service = email_service

    def register(self, request: UserRegisterRequest) -> UserRecord:
        existing = self._repo.get_by_email(request.email.lower())
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
        return self._repo.create(record)

    def authenticate(self, email: str, password: str) -> UserRecord:
        user = self._repo.get_by_email(email.lower())
        if user is None or not user.is_active:
            raise InvalidCredentialsError()
        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user

    def get_by_id(self, user_id: str) -> UserRecord:
        user = self._repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError()
        return user

    def update_profile(
        self,
        user_id: str,
        *,
        country: str | None = None,
        timezone_name: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
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
        if latitude is not None:
            user.latitude = latitude
        if longitude is not None:
            user.longitude = longitude
        if prayer_calculation_method is not None:
            user.prayer_calculation_method = prayer_calculation_method
        if asr_method is not None:
            user.asr_method = asr_method
        if goals is not None:
            user.goals = goals
        if preferred_language is not None:
            user.preferred_language = preferred_language

        user.updated_at = datetime.now(timezone.utc)
        return self._repo.update(user)

    def request_password_reset(self, email: str) -> None:
        """
        Initiates the password reset flow.
        Generates a token and emails it if the user exists.
        Returns silently if the user doesn't exist (prevent email enumeration).
        """
        if self._token_repo is None or self._email_service is None:
            raise RuntimeError("Password recovery components not configured.")

        # Email is treated case-insensitively
        record = self._repo.get_by_email(email.lower())
        if record is None:
            return  # Fail silently to prevent enumeration

        # Generate a high-entropy secure token
        raw_token = secrets.token_urlsafe(32)
        # Use SHA256 for fast exact-match lookup since the token itself has high entropy
        hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()

        # Save token
        token_record = PasswordResetToken(
            id=str(uuid.uuid4()),
            user_id=record.id,
            hashed_token=hashed_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            created_at=datetime.now(timezone.utc),
        )
        self._token_repo.create(token_record)

        # Send email
        self._email_service.send_password_reset_email(record.email, raw_token)

    def reset_password(self, token: str, new_password: str) -> None:
        """
        Completes the password reset flow.
        """
        if self._token_repo is None:
            raise RuntimeError("Password recovery components not configured.")

        hashed_token = hashlib.sha256(token.encode()).hexdigest()

        token_record = self._token_repo.get_by_hashed_token(hashed_token)
        if token_record is None:
            raise ValueError("Invalid or expired reset token.")

        # Handle SQLite returning naive datetimes despite timezone=True
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            self._token_repo.delete(token_record.id)
            raise ValueError("Invalid or expired reset token.")

        # Update user password
        user_record = self._repo.get_by_id(token_record.user_id)
        if user_record is None:
            raise ValueError("Invalid or expired reset token.")

        user_record.hashed_password = hash_password(new_password)
        self._repo.update(user_record)

        # Invalidate token
        self._token_repo.delete(token_record.id)

