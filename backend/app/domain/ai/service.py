"""
AI domain service.

Implements the conversation and memory workflow while enforcing:
- The assistant capability boundary (explain/summarise/plan/reflect/encourage).
- Safety policy refusals before any model call.
- Source attribution requirements.
- Privacy controls: memory is opt-in, no worship-performance context by default.

Per 039_AI_Principles.md: this service depends only on the AIGateway and
repository Protocols, never on a specific provider SDK.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.ai.entities import (
    AIGateway,
    Conversation,
    ConversationMessage,
    ConversationRepository,
    MemoryEntry,
    MemoryRepository,
    MessageRole,
    SafetyOutcome,
)
from app.domain.ai.entities import ConfidenceLevel
from app.domain.ai.prompts import (
    CURRENT_SYSTEM_PROMPT,
    REFUSAL_RESPONSE,
    parse_assistant_response,
    should_refuse,
)


class ConversationNotFoundError(Exception):
    pass


class AIService:
    def __init__(
        self,
        gateway: AIGateway,
        conversation_repo: ConversationRepository,
        memory_repo: MemoryRepository,
        *,
        model: str = "gpt-4o-mini",
        max_tokens: int = 800,
        temperature: float = 0.4,
    ) -> None:
        self._gateway = gateway
        self._conversations = conversation_repo
        self._memory = memory_repo
        self._model = model
        self._max_tokens = max_tokens
        self._temperature = temperature

    # ── Conversations ────────────────────────────────────────────────────────

    def create_conversation(self, user_id: str) -> Conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
        )
        self._conversations.save(conversation)
        return conversation

    def send_message(
        self,
        conversation_id: str,
        user_id: str,
        user_content: str,
        *,
        include_memory: bool = False,
    ) -> ConversationMessage:
        conversation = self._conversations.get_by_id(conversation_id, user_id)
        if conversation is None:
            raise ConversationNotFoundError(conversation_id)

        user_message = ConversationMessage(
            role=MessageRole.USER,
            content=user_content,
        )
        conversation.messages.append(user_message)

        # Safety policy: refuse before calling the model.
        if should_refuse(user_content):
            assistant_message = ConversationMessage(
                role=MessageRole.ASSISTANT,
                content=REFUSAL_RESPONSE,
                safety_outcome=SafetyOutcome.REFUSED,
                confidence=ConfidenceLevel.UNKNOWN,
            )
        else:
            assistant_message = self._call_gateway(
                conversation, user_id, include_memory=include_memory
            )

        conversation.messages.append(assistant_message)
        conversation.updated_at = datetime.now(timezone.utc)
        self._conversations.save(conversation)
        return assistant_message

    def _call_gateway(
        self,
        conversation: Conversation,
        user_id: str,
        *,
        include_memory: bool,
    ) -> ConversationMessage:
        messages: list[dict] = [
            {"role": "system", "content": CURRENT_SYSTEM_PROMPT.text}
        ]

        # Opt-in memory context (never added by default — privacy-first).
        if include_memory:
            memory_entries = self._memory.list_for_user(user_id)
            if memory_entries:
                memory_block = "\n".join(e.content for e in memory_entries)
                messages.append({
                    "role": "system",
                    "content": f"User memory (shared with consent):\n{memory_block}",
                })

        # Append conversation history (limit to last 20 turns to keep context bounded).
        for msg in conversation.messages[-40:]:
            if msg.role in (MessageRole.USER, MessageRole.ASSISTANT):
                messages.append({"role": msg.role.value, "content": msg.content})

        raw_response = self._gateway.complete(
            messages,
            model=self._model,
            max_tokens=self._max_tokens,
            temperature=self._temperature,
        )
        parsed = parse_assistant_response(raw_response)

        return ConversationMessage(
            role=MessageRole.ASSISTANT,
            content=parsed.content,
            safety_outcome=SafetyOutcome.SAFE,
            confidence=parsed.confidence,
            source_refs=parsed.source_refs,
        )

    def get_conversation(self, conversation_id: str, user_id: str) -> Conversation:
        conv = self._conversations.get_by_id(conversation_id, user_id)
        if conv is None:
            raise ConversationNotFoundError(conversation_id)
        return conv

    def list_conversations(self, user_id: str) -> list[Conversation]:
        return self._conversations.list_for_user(user_id)

    def delete_conversation(self, conversation_id: str, user_id: str) -> None:
        found = self._conversations.delete(conversation_id, user_id)
        if not found:
            raise ConversationNotFoundError(conversation_id)

    # ── Memory ───────────────────────────────────────────────────────────────

    def list_memory(self, user_id: str) -> list[MemoryEntry]:
        return self._memory.list_for_user(user_id)

    def delete_memory(self, entry_id: str, user_id: str) -> None:
        found = self._memory.delete(entry_id, user_id)
        if not found:
            raise ValueError(f"Memory entry {entry_id!r} not found.")
