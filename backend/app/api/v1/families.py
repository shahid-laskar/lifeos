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


from app.api.deps import get_family_service


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
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> FamilyResponse:
    family = service.create_family(name=body.name, owner_id=user.id)
    return _family_to_response(family)


@router.get("", response_model=list[FamilyResponse])
def list_families(
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> list[FamilyResponse]:
    return [_family_to_response(f) for f in service.list_families(user.id)]


@router.post("/{family_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    family_id: str,
    body: InviteMemberRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> InvitationResponse:
    try:
        from app.domain.family.entities import MemberRole
        role = MemberRole(body.role) if body.role else MemberRole.ADULT
        inv = service.invite_member(family_id, user.id, body.email, role)
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
    service: Annotated[FamilyService, Depends(get_family_service)],
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
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> None:
    try:
        service.remove_member(family_id, user.id, member_id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{family_id}", response_model=FamilyResponse)
def get_family(
    family_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> FamilyResponse:
    try:
        family = service.get_family(family_id, user.id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return _family_to_response(family)


@router.delete("/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family(
    family_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> None:
    try:
        service.delete_family(family_id, user.id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{family_id}/invitations", response_model=list[InvitationResponse])
def list_invitations(
    family_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> list[InvitationResponse]:
    try:
        invitations = service.list_invitations(family_id, user.id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return [
        InvitationResponse(
            id=inv.id,
            family_id=inv.family_id,
            invited_email=inv.invited_email,
            status=inv.status.value,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
        )
        for inv in invitations
    ]


@router.delete("/{family_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    family_id: str,
    invitation_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> None:
    try:
        service.revoke_invitation(family_id, invitation_id, user.id)
    except FamilyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Family not found.") from exc
    except InvitationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Invitation not found.") from exc
    except FamilyPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/invitations/{invitation_id}/accept", response_model=FamilyResponse)
def accept_invitation_by_id(
    invitation_id: str,
    body: AcceptInvitationRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[FamilyService, Depends(get_family_service)],
) -> FamilyResponse:
    try:
        family = service.accept_invitation(invitation_id, user.id, body.email)
    except InvitationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Invitation not found.") from exc
    except (AlreadyMemberError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _family_to_response(family)

# ---------------------------------------------------------------------------
# PHASE 6: FAMILY EVENTS, GOALS, AND TASKS
# ---------------------------------------------------------------------------

from app.api.deps import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.infrastructure.orm_models import FamilyEventORM, FamilyGoalORM, FamilyTaskORM
from app.domain.family.models import (
    FamilyEventResponse, FamilyEventCreate,
    FamilyGoalResponse, FamilyGoalCreate,
    FamilyTaskResponse, FamilyTaskCreate
)
import uuid
from datetime import datetime, timezone

@router.get("/{family_id}/events", response_model=list[FamilyEventResponse])
def get_family_events(
    family_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = db.execute(select(FamilyEventORM).where(FamilyEventORM.family_id == family_id).order_by(FamilyEventORM.start_time)).scalars().all()
    return events

@router.post("/{family_id}/events", response_model=FamilyEventResponse, status_code=status.HTTP_201_CREATED)
def create_family_event(
    family_id: str,
    req: FamilyEventCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    ev = FamilyEventORM(
        id=str(uuid.uuid4()),
        family_id=family_id,
        creator_id=user.id,
        title=req.title,
        description=req.description,
        start_time=req.start_time,
        end_time=req.end_time,
        is_all_day=req.is_all_day,
        location=req.location,
        created_at=now,
        updated_at=now
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.delete("/{family_id}/events/{event_id}")
def delete_family_event(
    family_id: str,
    event_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ev = db.execute(select(FamilyEventORM).where(FamilyEventORM.id == event_id)).scalar_one_or_none()
    if ev:
        db.delete(ev)
        db.commit()


@router.get("/{family_id}/goals", response_model=list[FamilyGoalResponse])
def get_family_goals(
    family_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.execute(select(FamilyGoalORM).where(FamilyGoalORM.family_id == family_id)).scalars().all()
    return goals

@router.post("/{family_id}/goals", response_model=FamilyGoalResponse, status_code=status.HTTP_201_CREATED)
def create_family_goal(
    family_id: str,
    req: FamilyGoalCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    g = FamilyGoalORM(
        id=str(uuid.uuid4()),
        family_id=family_id,
        creator_id=user.id,
        title=req.title,
        description=req.description,
        target_date=req.target_date,
        is_completed=req.is_completed,
        created_at=now,
        updated_at=now
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.get("/{family_id}/tasks", response_model=list[FamilyTaskResponse])
def get_family_tasks(
    family_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.execute(select(FamilyTaskORM).where(FamilyTaskORM.family_id == family_id)).scalars().all()
    return tasks

@router.post("/{family_id}/tasks", response_model=FamilyTaskResponse, status_code=status.HTTP_201_CREATED)
def create_family_task(
    family_id: str,
    req: FamilyTaskCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    t = FamilyTaskORM(
        id=str(uuid.uuid4()),
        family_id=family_id,
        creator_id=user.id,
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        is_completed=req.is_completed,
        assignee_id=req.assignee_id,
        created_at=now,
        updated_at=now
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.post("/{family_id}/tasks/{task_id}/toggle", response_model=FamilyTaskResponse)
def toggle_family_task(
    family_id: str,
    task_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    t = db.execute(select(FamilyTaskORM).where(FamilyTaskORM.id == task_id)).scalar_one_or_none()
    if t:
        t.is_completed = not t.is_completed
        t.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(t)
    return t

