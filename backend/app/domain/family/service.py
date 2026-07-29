"""
Family domain service.

Enforces:
- Only the owner can invite, remove members, or delete the family.
- Members see only family structure, not each other's private data.
- Worship, Quran progress, and personal habits are never shared here.
- Dependent role has the most restricted access by default.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from app.domain.family.entities import (
    Family,
    FamilyInvitation,
    FamilyMember,
    FamilyRepository,
    InvitationRepository,
    InvitationStatus,
    MemberRole,
)


class FamilyNotFoundError(Exception):
    pass


class FamilyPermissionError(Exception):
    pass


class InvitationNotFoundError(Exception):
    pass


class AlreadyMemberError(Exception):
    pass


INVITATION_EXPIRY_DAYS = 7


class FamilyService:
    def __init__(
        self,
        family_repo: FamilyRepository,
        invitation_repo: InvitationRepository,
    ) -> None:
        self._families = family_repo
        self._invitations = invitation_repo

    # ── Family CRUD ──────────────────────────────────────────────────────────

    def create_family(self, name: str, owner_id: str) -> Family:
        family = Family(
            id=str(uuid.uuid4()),
            name=name,
            owner_id=owner_id,
            members=[FamilyMember(user_id=owner_id, role=MemberRole.OWNER)],
        )
        self._families.save(family)
        return family

    def get_family(self, family_id: str, requesting_user_id: str) -> Family:
        family = self._families.get_by_id(family_id)
        if family is None:
            raise FamilyNotFoundError(family_id)
        if not self._is_member(family, requesting_user_id):
            raise FamilyPermissionError("You are not a member of this family.")
        return family

    def list_families(self, user_id: str) -> list[Family]:
        return self._families.list_for_user(user_id)

    # ── Invitations ──────────────────────────────────────────────────────────

    def invite_member(
        self, family_id: str, requesting_user_id: str, invited_email: str
    ) -> FamilyInvitation:
        family = self._families.get_by_id(family_id)
        if family is None:
            raise FamilyNotFoundError(family_id)
        if family.owner_id != requesting_user_id:
            raise FamilyPermissionError("Only the family owner can invite members.")

        invitation = FamilyInvitation(
            id=str(uuid.uuid4()),
            family_id=family_id,
            invited_email=invited_email,
            invited_by_user_id=requesting_user_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRY_DAYS),
        )
        self._invitations.save(invitation)
        return invitation

    def accept_invitation(
        self, invitation_id: str, accepting_user_id: str, accepting_email: str
    ) -> Family:
        invitation = self._invitations.get_by_id(invitation_id)
        if invitation is None or invitation.invited_email != accepting_email:
            raise InvitationNotFoundError(invitation_id)
        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("This invitation is no longer valid.")
        if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
            invitation.status = InvitationStatus.EXPIRED
            self._invitations.save(invitation)
            raise ValueError("This invitation has expired.")

        family = self._families.get_by_id(invitation.family_id)
        if family is None:
            raise FamilyNotFoundError(invitation.family_id)
        if self._is_member(family, accepting_user_id):
            raise AlreadyMemberError("You are already a member of this family.")

        family.members.append(
            FamilyMember(user_id=accepting_user_id, role=MemberRole.ADULT)
        )
        family.updated_at = datetime.now(timezone.utc)
        self._families.save(family)

        invitation.status = InvitationStatus.ACCEPTED
        self._invitations.save(invitation)
        return family

    # ── Member management ────────────────────────────────────────────────────

    def remove_member(
        self, family_id: str, requesting_user_id: str, target_user_id: str
    ) -> Family:
        family = self._families.get_by_id(family_id)
        if family is None:
            raise FamilyNotFoundError(family_id)

        is_self_removal = requesting_user_id == target_user_id
        is_owner_action = family.owner_id == requesting_user_id

        if not is_self_removal and not is_owner_action:
            raise FamilyPermissionError("Only the owner can remove other members.")
        if target_user_id == family.owner_id and not is_self_removal:
            raise FamilyPermissionError("The owner cannot be removed by others.")

        family.members = [m for m in family.members if m.user_id != target_user_id]
        family.updated_at = datetime.now(timezone.utc)
        self._families.save(family)
        return family

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _is_member(family: Family, user_id: str) -> bool:
        return any(m.user_id == user_id for m in family.members)
