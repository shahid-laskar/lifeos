"""Pydantic request/response models for the AI API."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CreateConversationResponse(BaseModel):
    id: str
    created_at: datetime


class MessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    include_memory: bool = False


class MessageResponse(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    safety_outcome: Literal["safe", "refused", "flagged"]
    source_refs: list[str]
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    title: str | None
    messages: list[MessageResponse]
    created_at: datetime
    updated_at: datetime


class MemoryEntryResponse(BaseModel):
    id: str
    content: str
    created_at: datetime
