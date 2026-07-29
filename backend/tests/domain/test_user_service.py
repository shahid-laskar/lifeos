"""
Unit tests for UserService.

Uses an in-memory fake implementing the UserRepository Protocol - no
database involved. This proves the domain/user/service.py split from
infrastructure is real, not just aspirational: if this fake didn't
type-check against the same Protocol the SQLAlchemy repository uses, the
architecture claim in ADR-004 would be false.
"""
import pytest

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.user.entities import UserRecord
from app.domain.user.goals import OnboardingGoal
from app.domain.user.models import UserRegisterRequest
from app.domain.user.service import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserService,
)


class InMemoryUserRepository:
    """Fake implementing the same shape as UserRepository (Protocol) -
    structural typing means no explicit inheritance is needed."""

    def __init__(self):
        self._by_id: dict[str, UserRecord] = {}

    def get_by_email(self, email: str) -> UserRecord | None:
        return next((u for u in self._by_id.values() if u.email == email), None)

    def get_by_id(self, user_id: str) -> UserRecord | None:
        return self._by_id.get(user_id)

    def create(self, record: UserRecord) -> UserRecord:
        self._by_id[record.id] = record
        return record

    def update(self, record: UserRecord) -> UserRecord:
        self._by_id[record.id] = record
        return record


@pytest.fixture
def service() -> UserService:
    return UserService(InMemoryUserRepository())


def test_register_creates_user_with_hashed_password(service: UserService):
    request = UserRegisterRequest(
        email="fatima@example.com", password="correct-horse-1", terms_accepted=True
    )
    user = service.register(request)

    assert user.email == "fatima@example.com"
    assert user.hashed_password != "correct-horse-1"  # never stored in plaintext
    assert user.is_active is True
    assert user.goals == []


def test_register_rejects_duplicate_email(service: UserService):
    request = UserRegisterRequest(
        email="omar@example.com", password="correct-horse-1", terms_accepted=True
    )
    service.register(request)

    with pytest.raises(EmailAlreadyRegisteredError):
        service.register(request)


def test_register_is_case_insensitive_on_email(service: UserService):
    service.register(
        UserRegisterRequest(email="Aisha@Example.com", password="correct-horse-1", terms_accepted=True)
    )
    with pytest.raises(EmailAlreadyRegisteredError):
        service.register(
            UserRegisterRequest(
                email="aisha@example.com", password="another-password-1", terms_accepted=True
            )
        )


def test_terms_must_be_accepted_to_register():
    with pytest.raises(ValueError):
        UserRegisterRequest(email="x@example.com", password="correct-horse-1", terms_accepted=False)


def test_authenticate_succeeds_with_correct_password(service: UserService):
    service.register(
        UserRegisterRequest(email="bilal@example.com", password="correct-horse-1", terms_accepted=True)
    )
    user = service.authenticate("bilal@example.com", "correct-horse-1")
    assert user.email == "bilal@example.com"


def test_authenticate_fails_with_wrong_password(service: UserService):
    service.register(
        UserRegisterRequest(email="zayd@example.com", password="correct-horse-1", terms_accepted=True)
    )
    with pytest.raises(InvalidCredentialsError):
        service.authenticate("zayd@example.com", "wrong-password")


def test_authenticate_fails_for_nonexistent_user(service: UserService):
    with pytest.raises(InvalidCredentialsError):
        service.authenticate("nobody@example.com", "whatever-1")


def test_update_profile_only_changes_provided_fields(service: UserService):
    user = service.register(
        UserRegisterRequest(email="hana@example.com", password="correct-horse-1", terms_accepted=True)
    )
    updated = service.update_profile(user.id, country="GB")
    assert updated.country == "GB"
    assert updated.timezone is None  # untouched fields remain None, not reset

    updated_again = service.update_profile(
        updated.id,
        timezone_name="Europe/London",
        prayer_calculation_method=CalculationMethod.MWL,
        asr_method=AsrMethod.STANDARD,
        goals=[OnboardingGoal.PRAY_CONSISTENTLY, OnboardingGoal.READ_QURAN_DAILY],
    )
    assert updated_again.country == "GB"  # still preserved from before
    assert updated_again.timezone == "Europe/London"
    assert updated_again.goals == [
        OnboardingGoal.PRAY_CONSISTENTLY,
        OnboardingGoal.READ_QURAN_DAILY,
    ]


def test_update_profile_raises_for_unknown_user(service: UserService):
    with pytest.raises(UserNotFoundError):
        service.update_profile("does-not-exist", country="GB")


def test_no_engagement_metric_fields_on_user_entity(service: UserService):
    """Constitutional guardrail (ADR-003), same principle applied to the
    user domain: no session/streak/notification-open fields."""
    user = service.register(
        UserRegisterRequest(email="idris@example.com", password="correct-horse-1", terms_accepted=True)
    )
    forbidden = {"session_duration", "streak", "notifications_opened", "dau", "last_active_at"}
    assert forbidden.isdisjoint(vars(user).keys())
