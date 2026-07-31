"""SQLAlchemy implementation of the AI Repositories."""
from __future__ import annotations

import uuid
from typing import cast
import json

from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.domain.ai.entities import (
    ConfidenceLevel,
    Conversation,
    ConversationMessage,
    MemoryEntry,
    MessageRole,
    SafetyOutcome,
)
from app.infrastructure.orm_models import AIConversationORM, AIMessageORM, AIMemoryORM

class ConversationRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(self, conversation: Conversation) -> None:
        orm_conv = self._session.get(AIConversationORM, conversation.id)
        if not orm_conv:
            orm_conv = AIConversationORM(
                id=conversation.id,
                user_id=conversation.user_id,
                title=conversation.title,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
            )
            self._session.add(orm_conv)
        else:
            orm_conv.title = conversation.title
            orm_conv.updated_at = conversation.updated_at

        # Messages sync (naive full replacement for simplicity given typical chat sizes, or append-only)
        self._session.execute(delete(AIMessageORM).where(AIMessageORM.conversation_id == conversation.id))
        for msg in conversation.messages:
            self._session.add(AIMessageORM(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                role=msg.role.value,
                content=msg.content,
                safety_outcome=msg.safety_outcome.value,
                confidence=msg.confidence.value,
                source_refs=msg.source_refs,
                created_at=msg.created_at
            ))
        self._session.commit()

    def get_by_id(self, conversation_id: str, user_id: str) -> Conversation | None:
        orm_conv = self._session.get(AIConversationORM, conversation_id)
        if not orm_conv or orm_conv.user_id != user_id:
            return None
            
        orm_msgs = self._session.scalars(
            select(AIMessageORM).where(AIMessageORM.conversation_id == conversation_id).order_by(AIMessageORM.created_at)
        ).all()
        
        messages = [
            ConversationMessage(
                role=MessageRole(m.role),
                content=m.content,
                safety_outcome=SafetyOutcome(m.safety_outcome),
                confidence=ConfidenceLevel(m.confidence or "unknown"),
                source_refs=m.source_refs or [],
                created_at=m.created_at
            ) for m in orm_msgs
        ]
        
        return Conversation(
            id=orm_conv.id,
            user_id=orm_conv.user_id,
            title=orm_conv.title,
            messages=messages,
            created_at=orm_conv.created_at,
            updated_at=orm_conv.updated_at
        )

    def list_for_user(self, user_id: str) -> list[Conversation]:
        stmt = select(AIConversationORM).where(AIConversationORM.user_id == user_id).order_by(AIConversationORM.updated_at.desc())
        orm_convs = self._session.scalars(stmt).all()
        return [cast(Conversation, self.get_by_id(c.id, user_id)) for c in orm_convs]

    def delete(self, conversation_id: str, user_id: str) -> bool:
        orm_conv = self._session.get(AIConversationORM, conversation_id)
        if not orm_conv or orm_conv.user_id != user_id:
            return False
            
        self._session.execute(delete(AIMessageORM).where(AIMessageORM.conversation_id == conversation_id))
        self._session.delete(orm_conv)
        self._session.commit()
        return True


class MemoryRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(self, entry: MemoryEntry) -> None:
        orm_entry = self._session.get(AIMemoryORM, entry.id)
        if not orm_entry:
            orm_entry = AIMemoryORM(
                id=entry.id,
                user_id=entry.user_id,
                content=entry.content,
                created_at=entry.created_at
            )
            self._session.add(orm_entry)
        else:
            orm_entry.content = entry.content
        self._session.commit()

    def get_by_id(self, entry_id: str, user_id: str) -> MemoryEntry | None:
        orm_entry = self._session.get(AIMemoryORM, entry_id)
        if not orm_entry or orm_entry.user_id != user_id:
            return None
        return MemoryEntry(
            id=orm_entry.id,
            user_id=orm_entry.user_id,
            content=orm_entry.content,
            created_at=orm_entry.created_at
        )

    def list_for_user(self, user_id: str) -> list[MemoryEntry]:
        stmt = select(AIMemoryORM).where(AIMemoryORM.user_id == user_id).order_by(AIMemoryORM.created_at.desc())
        return [
            MemoryEntry(id=e.id, user_id=e.user_id, content=e.content, created_at=e.created_at)
            for e in self._session.scalars(stmt).all()
        ]

    def delete(self, entry_id: str, user_id: str) -> bool:
        orm_entry = self._session.get(AIMemoryORM, entry_id)
        if not orm_entry or orm_entry.user_id != user_id:
            return False
        self._session.delete(orm_entry)
        self._session.commit()
        return True
