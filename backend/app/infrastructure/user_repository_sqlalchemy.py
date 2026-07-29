"""
SQLAlchemy implementation of UserRepository.

Implements the same Protocol shape as
tests/domain/test_user_service.py's InMemoryUserRepository - that symmetry is
the point. This class's only job is translation: ORM row <-> UserRecord.
No business rules live here (those belong in app/domain/user/service.py).
"""
from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.user.entities import PasswordResetToken, UserRecord
from app.domain.user.goals import OnboardingGoal
from app.domain.user.repository import PasswordResetTokenRepository, UserRepository
from app.infrastructure.orm_models import PasswordResetTokenORM, UserORM


def _to_record(row: UserORM) -> UserRecord:
    return UserRecord(
        id=row.id,
        email=row.email,
        hashed_password=row.hashed_password,
        is_active=row.is_active,
        terms_accepted_at=row.terms_accepted_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
        preferred_language=row.preferred_language,
        country=row.country,
        timezone=row.timezone,
        latitude=row.latitude,
        longitude=row.longitude,
        prayer_calculation_method=(
            CalculationMethod(row.prayer_calculation_method)
            if row.prayer_calculation_method
            else None
        ),
        asr_method=AsrMethod(row.asr_method) if row.asr_method else None,
        goals=[OnboardingGoal(g) for g in (row.goals or [])],
    )


def _apply_record_to_row(record: UserRecord, row: UserORM) -> None:
    row.id = record.id
    row.email = record.email
    row.hashed_password = record.hashed_password
    row.is_active = record.is_active
    row.preferred_language = record.preferred_language
    row.country = record.country
    row.timezone = record.timezone
    row.latitude = record.latitude
    row.longitude = record.longitude
    row.prayer_calculation_method = (
        record.prayer_calculation_method.value if record.prayer_calculation_method else None
    )
    row.asr_method = record.asr_method.value if record.asr_method else None
    row.goals = [g.value for g in record.goals]
    row.terms_accepted_at = record.terms_accepted_at
    row.created_at = record.created_at
    row.updated_at = record.updated_at


class SqlAlchemyUserRepository:
    """Implements the UserRepository Protocol (app/domain/user/repository.py)
    via structural typing - no explicit inheritance required."""

    def __init__(self, session: Session):
        self._session = session

    def get_by_email(self, email: str) -> UserRecord | None:
        row = self._session.query(UserORM).filter(UserORM.email == email).one_or_none()
        return _to_record(row) if row else None

    def get_by_id(self, user_id: str) -> UserRecord | None:
        row = self._session.get(UserORM, user_id)
        return _to_record(row) if row else None

    def create(self, record: UserRecord) -> UserRecord:
        row = UserORM()
        _apply_record_to_row(record, row)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return _to_record(row)

    def update(self, record: UserRecord) -> UserRecord:
        row = self._session.get(UserORM, record.id)
        if row is None:
            raise ValueError(f"Cannot update - no user with id {record.id}")
        _apply_record_to_row(record, row)
        self._session.commit()
        self._session.refresh(row)
        return _to_record(row)


class SqlAlchemyPasswordResetTokenRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, token: PasswordResetToken) -> PasswordResetToken:
        row = PasswordResetTokenORM(
            id=token.id,
            user_id=token.user_id,
            hashed_token=token.hashed_token,
            expires_at=token.expires_at,
            created_at=token.created_at,
        )
        self._session.add(row)
        self._session.commit()
        return token

    def get_by_hashed_token(self, hashed_token: str) -> PasswordResetToken | None:
        stmt = select(PasswordResetTokenORM).where(PasswordResetTokenORM.hashed_token == hashed_token)
        row = self._session.execute(stmt).scalar_one_or_none()
        if row is None:
            return None
        return PasswordResetToken(
            id=row.id,
            user_id=row.user_id,
            hashed_token=row.hashed_token,
            expires_at=row.expires_at,
            created_at=row.created_at,
        )

    def delete(self, token_id: str) -> None:
        stmt = select(PasswordResetTokenORM).where(PasswordResetTokenORM.id == token_id)
        row = self._session.execute(stmt).scalar_one_or_none()
        if row is not None:
            self._session.delete(row)
            self._session.commit()

