"""
UserRepository interface.

A `typing.Protocol`, not an ABC - structural typing keeps this lightweight.
Per 063_Domain_Driven_Design.md "Repositories": the domain service depends
only on this interface, never on a concrete SQLAlchemy/database
implementation. This is what makes app/domain/user/service.py unit-testable
without a real database (see tests/domain/test_user_service.py, which uses
an in-memory fake implementing this same Protocol).
"""
from typing import Protocol

from app.domain.user.entities import UserRecord


class UserRepository(Protocol):
    def get_by_email(self, email: str) -> UserRecord | None: ...

    def get_by_id(self, user_id: str) -> UserRecord | None: ...

    def create(self, record: UserRecord) -> UserRecord: ...

    def update(self, record: UserRecord) -> UserRecord: ...
