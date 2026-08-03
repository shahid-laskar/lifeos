"""Pydantic request/response models for the Family API."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CreateFamilyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FamilyMemberResponse(BaseModel):
    user_id: str
    role: str
    joined_at: datetime


class FamilyResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    members: list[FamilyMemberResponse]
    created_at: datetime
    updated_at: datetime


class InviteMemberRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=320)
    role: str = "adult"


class InvitationResponse(BaseModel):
    id: str
    family_id: str
    invited_email: str
    status: str
    created_at: datetime
    expires_at: datetime | None


class AcceptInvitationRequest(BaseModel):
    email: str


class RemoveMemberRequest(BaseModel):
    user_id: str

# Phase 6 Models

from datetime import date as date_type

class FamilyEventBase(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    location: str | None = None

class FamilyEventCreate(FamilyEventBase):
    pass

class FamilyEventResponse(FamilyEventBase):
    id: str
    family_id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

class FamilyGoalBase(BaseModel):
    title: str
    description: str | None = None
    target_date: date_type | None = None
    is_completed: bool = False

class FamilyGoalCreate(FamilyGoalBase):
    pass

class FamilyGoalResponse(FamilyGoalBase):
    id: str
    family_id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

class FamilyTaskBase(BaseModel):
    title: str
    description: str | None = None
    due_date: date_type | None = None
    is_completed: bool = False
    assignee_id: str | None = None

class FamilyTaskCreate(FamilyTaskBase):
    pass

class FamilyTaskResponse(FamilyTaskBase):
    id: str
    family_id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

