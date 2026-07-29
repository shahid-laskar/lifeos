"""
Family API.

POST   /api/v1/families
GET    /api/v1/families
POST   /api/v1/families/{id}/invitations
POST   /api/v1/families/{id}/members    (accept invitation)
DELETE /api/v1/families/{id}/members/{member_id}

All endpoints require authentication. Family data is private-by-default.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.domain.family.models import (
    AcceptInvitationRequest,
    CreateFamilyRequest,
    FamilyMemberResponse,
    FamilyResponse,
    InviteMemberRequest,
    InvitationResponse,
)
from app.domain.family.service import (
    AlreadyMemberError,
    FamilyNotFoundError,
    FamilyPermissionError,
    FamilyService,
    InvitationNotFoundError,
)
from app.domain.user.entities import UserRecord

router = APIRouter(prefix="/families", tags=["families"])


from app.infrastructure.family_repository import (
    InMemoryFamilyRepository,
    InMemoryInvitationRepository,
)

# Module-level singletons so state persists across requests within one process.
# A production deployment replaces these with SQLAlchemy-backed repositories.
_family_repo = InMemoryFamilyRepository()
_invitation_repo = InMemoryInvitationRepository()


def _get_family_service() -> FamilyService:
    return FamilyService(
        family_repo=_family_repo,
        invitation_repo=_invitation_repo,
    )


def _family_to_response(f) -> FamilyResponse:
    return FamilyResponse(
        id=f.id,
        name=f.name,
        owner_id=f.owner_id,
        members=[
            FamilyMemberResponse(
                user_id=m.user_id, role=m.role.value, joined_at=m.joined_at
            )
            for m in f.members
        ],
        created_at=f.created_at,
        updated_at=f.updated_at,
    )


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
def create_family(
    body: CreateFamilyRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> FamilyResponse:
    family = service.create_family(name=body.name, owner_id=user.id)
    return _family_to_response(family)


@router.get("", response_model=list[FamilyResponse])
def list_families(
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> list[FamilyResponse]:
    return [_family_to_response(f) for f in service.list_families(user.id)]


@router.post("/{family_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    family_id: str,
    body: InviteMemberRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> InvitationResponse:
    try:
        inv = service.invite_member(family_id, user.id, body.email)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return InvitationResponse(
        id=inv.id,
        family_id=inv.family_id,
        invited_email=inv.invited_email,
        status=inv.status.value,
        created_at=inv.created_at,
        expires_at=inv.expires_at,
    )


@router.post("/{family_id}/members", response_model=FamilyResponse)
def accept_invitation(
    family_id: str,
    body: AcceptInvitationRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> FamilyResponse:
    # body.invitation_id routes to the invitation; body.email must match.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use POST /api/v1/invitations/{id}/accept to accept an invitation.",
    )


@router.delete("/{family_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    family_id: str,
    member_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> None:
    try:
        service.remove_member(family_id, user.id, member_id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/invitations/{invitation_id}/accept", response_model=FamilyResponse)
def accept_invitation_by_id(
    invitation_id: str,
    body: AcceptInvitationRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(_get_family_service)],
) -> FamilyResponse:
    try:
        family = service.accept_invitation(invitation_id, user.id, body.email)
    except InvitationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Invitation not found.") from exc
    except (AlreadyMemberError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _family_to_response(family)
