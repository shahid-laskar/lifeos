"""
AI domain entities.

Per ADR-012 / 039_AI_Principles.md:
- The assistant must never present itself as a scholar, judge, imam, or authority.
- All Islamic content must carry source attribution and uncertainty labels.
- Memory is opt-in and inspectable/deletable by the user.
- No worship-performance scoring or piety telemetry.
- A provider-neutral gateway owns model routing; domain code never imports
  a specific provider SDK.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Protocol, runtime_checkable


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class SafetyOutcome(str, Enum):
    SAFE = "safe"
    REFUSED = "refused"
    FLAGGED = "flagged"


@dataclass(frozen=True)
class ConversationMessage:
    role: MessageRole
    content: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    safety_outcome: SafetyOutcome = SafetyOutcome.SAFE
    source_refs: list[str] = field(default_factory=list)


@dataclass
class Conversation:
    id: str
    user_id: str
    messages: list[ConversationMessage] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    title: str | None = None


@dataclass(frozen=True)
class MemoryEntry:
    id: str
    user_id: str
    content: str
    created_at: datetime


@runtime_checkable
class AIGateway(Protocol):
    """Provider-neutral interface for language model completions.

    Any concrete implementation (OpenAI, Anthropic, local model) must satisfy
    this protocol. Domain code depends only on this protocol — never on a
    specific SDK.
    """

    def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> str: ...


@runtime_checkable
class ConversationRepository(Protocol):
    def save(self, conversation: Conversation) -> None: ...
    def get_by_id(self, conversation_id: str, user_id: str) -> Conversation | None: ...
    def list_for_user(self, user_id: str) -> list[Conversation]: ...
    def delete(self, conversation_id: str, user_id: str) -> bool: ...


@runtime_checkable
class MemoryRepository(Protocol):
    def save(self, entry: MemoryEntry) -> None: ...
    def list_for_user(self, user_id: str) -> list[MemoryEntry]: ...
    def delete(self, entry_id: str, user_id: str) -> bool: ...
