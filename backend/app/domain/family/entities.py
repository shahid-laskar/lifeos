"""
Family domain entities.

Per ADR-012 / 026_Family_Model.md:
- Households are private-by-default. No shared data without explicit consent.
- Worship and personal progress remain private unless deliberately shared.
- Least-privilege role defaults: members cannot see each other's private data.
- No public piety scores or leaderboards (Article 6).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Protocol, runtime_checkable


class MemberRole(str, Enum):
    OWNER = "owner"
    ADULT = "adult"
    DEPENDENT = "dependent"


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"
    EXPIRED = "expired"


@dataclass
class FamilyMember:
    user_id: str
    role: MemberRole
    joined_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class FamilyInvitation:
    id: str
    family_id: str
    invited_email: str
    invited_by_user_id: str
    status: InvitationStatus = InvitationStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime | None = None


@dataclass
class Family:
    id: str
    name: str
    owner_id: str
    members: list[FamilyMember] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@runtime_checkable
class FamilyRepository(Protocol):
    def save(self, family: Family) -> None: ...
    def get_by_id(self, family_id: str) -> Family | None: ...
    def list_for_user(self, user_id: str) -> list[Family]: ...
    def delete(self, family_id: str) -> bool: ...


@runtime_checkable
class InvitationRepository(Protocol):
    def save(self, invitation: FamilyInvitation) -> None: ...
    def get_by_id(self, invitation_id: str) -> FamilyInvitation | None: ...
    def list_for_family(self, family_id: str) -> list[FamilyInvitation]: ...
    def get_pending_for_email(self, email: str) -> list[FamilyInvitation]: ...
