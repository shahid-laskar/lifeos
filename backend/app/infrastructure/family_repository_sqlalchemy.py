"""SQLAlchemy implementation of the Family Repository."""
from __future__ import annotations

from typing import cast

from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.domain.family.entities import Family, FamilyMember, MemberRole, FamilyInvitation, InvitationStatus
from app.infrastructure.orm_models import FamilyORM, FamilyMemberORM, FamilyInvitationORM

class FamilyRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(self, family: Family) -> None:
        orm_family = self._session.get(FamilyORM, family.id)
        if not orm_family:
            orm_family = FamilyORM(
                id=family.id,
                name=family.name,
                owner_id=family.owner_id,
                created_at=family.created_at,
                updated_at=family.updated_at,
            )
            self._session.add(orm_family)
        else:
            orm_family.name = family.name
            orm_family.updated_at = family.updated_at

        # Members sync
        self._session.execute(delete(FamilyMemberORM).where(FamilyMemberORM.family_id == family.id))
        for member in family.members:
            self._session.add(FamilyMemberORM(
                family_id=family.id,
                user_id=member.user_id,
                role=member.role.value
            ))
        self._session.commit()

    def get_by_id(self, family_id: str) -> Family | None:
        orm_family = self._session.get(FamilyORM, family_id)
        if not orm_family:
            return None
            
        orm_members = self._session.scalars(select(FamilyMemberORM).where(FamilyMemberORM.family_id == family_id)).all()
        members = [FamilyMember(user_id=m.user_id, role=MemberRole(m.role)) for m in orm_members]
        
        return Family(
            id=orm_family.id,
            name=orm_family.name,
            owner_id=orm_family.owner_id,
            members=members,
            created_at=orm_family.created_at,
            updated_at=orm_family.updated_at
        )

    def list_for_user(self, user_id: str) -> list[Family]:
        stmt = select(FamilyORM).join(FamilyMemberORM).where(FamilyMemberORM.user_id == user_id)
        orm_families = self._session.scalars(stmt).all()
        return [cast(Family, self.get_by_id(f.id)) for f in orm_families]

    def delete(self, family_id: str) -> bool:
        orm_family = self._session.get(FamilyORM, family_id)
        if not orm_family:
            return False
        
        self._session.execute(delete(FamilyInvitationORM).where(FamilyInvitationORM.family_id == family_id))
        self._session.execute(delete(FamilyMemberORM).where(FamilyMemberORM.family_id == family_id))
        self._session.delete(orm_family)
        self._session.commit()
        return True


class InvitationRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(self, invitation: FamilyInvitation) -> None:
        orm_inv = self._session.get(FamilyInvitationORM, invitation.id)
        if not orm_inv:
            orm_inv = FamilyInvitationORM(
                id=invitation.id,
                family_id=invitation.family_id,
                invited_email=invitation.invited_email,
                invited_by_user_id=invitation.invited_by_user_id,
                role=invitation.role.value,
                hashed_token=invitation.hashed_token,
                status=invitation.status.value,
                expires_at=invitation.expires_at,
                created_at=invitation.created_at
            )
            self._session.add(orm_inv)
        else:
            orm_inv.status = invitation.status.value
            
        self._session.commit()

    def get_by_id(self, invitation_id: str) -> FamilyInvitation | None:
        orm_inv = self._session.get(FamilyInvitationORM, invitation_id)
        if not orm_inv:
            return None
        return self._to_domain(orm_inv)

    def list_for_family(self, family_id: str) -> list[FamilyInvitation]:
        stmt = select(FamilyInvitationORM).where(FamilyInvitationORM.family_id == family_id)
        return [self._to_domain(i) for i in self._session.scalars(stmt).all()]

    def get_pending_for_email(self, email: str) -> list[FamilyInvitation]:
        stmt = select(FamilyInvitationORM).where(
            FamilyInvitationORM.invited_email == email,
            FamilyInvitationORM.status == InvitationStatus.PENDING.value
        )
        return [self._to_domain(i) for i in self._session.scalars(stmt).all()]

    def _to_domain(self, orm_inv: FamilyInvitationORM) -> FamilyInvitation:
        return FamilyInvitation(
            id=orm_inv.id,
            family_id=orm_inv.family_id,
            invited_email=orm_inv.invited_email,
            invited_by_user_id=orm_inv.invited_by_user_id,
            role=MemberRole(orm_inv.role),
            hashed_token=orm_inv.hashed_token,
            status=InvitationStatus(orm_inv.status),
            expires_at=orm_inv.expires_at,
            created_at=orm_inv.created_at
        )
