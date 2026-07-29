"""In-memory family and invitation repositories for development/testing."""
from __future__ import annotations

from app.domain.family.entities import Family, FamilyInvitation


class InMemoryFamilyRepository:
    def __init__(self) -> None:
        self._store: dict[str, Family] = {}

    def save(self, family: Family) -> None:
        self._store[family.id] = family

    def get_by_id(self, family_id: str) -> Family | None:
        return self._store.get(family_id)

    def list_for_user(self, user_id: str) -> list[Family]:
        return [f for f in self._store.values() if any(m.user_id == user_id for m in f.members)]

    def delete(self, family_id: str) -> bool:
        if family_id not in self._store:
            return False
        del self._store[family_id]
        return True


class InMemoryInvitationRepository:
    def __init__(self) -> None:
        self._store: dict[str, FamilyInvitation] = {}

    def save(self, invitation: FamilyInvitation) -> None:
        self._store[invitation.id] = invitation

    def get_by_id(self, invitation_id: str) -> FamilyInvitation | None:
        return self._store.get(invitation_id)

    def list_for_family(self, family_id: str) -> list[FamilyInvitation]:
        return [i for i in self._store.values() if i.family_id == family_id]

    def get_pending_for_email(self, email: str) -> list[FamilyInvitation]:
        from app.domain.family.entities import InvitationStatus
        return [
            i for i in self._store.values()
            if i.invited_email == email and i.status == InvitationStatus.PENDING
        ]
