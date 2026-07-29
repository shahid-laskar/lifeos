"""
In-memory AI conversation and memory repositories.

These are the initial implementations for development and testing. A
production deployment would persist to a database table. The domain service
depends only on the Repository protocols, so swapping implementations requires
no domain changes.
"""
from __future__ import annotations

from app.domain.ai.entities import (
    Conversation,
    MemoryEntry,
)


class InMemoryConversationRepository:
    def __init__(self) -> None:
        self._store: dict[str, Conversation] = {}

    def save(self, conversation: Conversation) -> None:
        self._store[conversation.id] = conversation

    def get_by_id(self, conversation_id: str, user_id: str) -> Conversation | None:
        conv = self._store.get(conversation_id)
        if conv is None or conv.user_id != user_id:
            return None
        return conv

    def list_for_user(self, user_id: str) -> list[Conversation]:
        return [c for c in self._store.values() if c.user_id == user_id]

    def delete(self, conversation_id: str, user_id: str) -> bool:
        conv = self._store.get(conversation_id)
        if conv is None or conv.user_id != user_id:
            return False
        del self._store[conversation_id]
        return True


class InMemoryMemoryRepository:
    def __init__(self) -> None:
        self._store: dict[str, MemoryEntry] = {}

    def save(self, entry: MemoryEntry) -> None:
        self._store[entry.id] = entry

    def list_for_user(self, user_id: str) -> list[MemoryEntry]:
        return [e for e in self._store.values() if e.user_id == user_id]

    def delete(self, entry_id: str, user_id: str) -> bool:
        entry = self._store.get(entry_id)
        if entry is None or entry.user_id != user_id:
            return False
        del self._store[entry_id]
        return True
