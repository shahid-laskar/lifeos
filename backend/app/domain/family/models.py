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
