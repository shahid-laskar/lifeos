"""
AI conversation API.

Per ADR-012 / 039_AI_Principles.md:
- POST /api/v1/ai/conversations
- POST /api/v1/ai/conversations/{id}/messages
- GET  /api/v1/ai/conversations/{id}
- GET  /api/v1/ai/conversations
- DELETE /api/v1/ai/conversations/{id}
- GET  /api/v1/ai/memory
- DELETE /api/v1/ai/memory/{id}

All endpoints require authentication. No unauthenticated AI access.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_ai_service, get_current_user
from app.domain.ai.models import (
    ConversationResponse,
    CreateConversationResponse,
    MemoryEntryResponse,
    MessageRequest,
    MessageResponse,
)
from app.domain.ai.service import AIService, ConversationNotFoundError
from app.domain.user.entities import UserRecord

router = APIRouter(prefix="/ai", tags=["ai"])


def _msg_to_response(msg) -> MessageResponse:
    return MessageResponse(
        role=msg.role.value,
        content=msg.content,
        safety_outcome=msg.safety_outcome.value,
        source_refs=msg.source_refs,
        created_at=msg.created_at,
    )


def _conv_to_response(conv) -> ConversationResponse:
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        messages=[_msg_to_response(m) for m in conv.messages],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.post("/conversations", response_model=CreateConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> CreateConversationResponse:
    conv = ai_service.create_conversation(user.id)
    return CreateConversationResponse(id=conv.id, created_at=conv.created_at)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: str,
    body: MessageRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> MessageResponse:
    try:
        msg = ai_service.send_message(
            conversation_id,
            user.id,
            body.content,
            include_memory=body.include_memory,
        )
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Conversation not found.") from exc
    return _msg_to_response(msg)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> ConversationResponse:
    try:
        conv = ai_service.get_conversation(conversation_id, user.id)
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Conversation not found.") from exc
    return _conv_to_response(conv)


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> list[ConversationResponse]:
    return [_conv_to_response(c) for c in ai_service.list_conversations(user.id)]


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> None:
    try:
        ai_service.delete_conversation(conversation_id, user.id)
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Conversation not found.") from exc


@router.get("/memory", response_model=list[MemoryEntryResponse])
def list_memory(
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> list[MemoryEntryResponse]:
    entries = ai_service.list_memory(user.id)
    return [
        MemoryEntryResponse(id=e.id, content=e.content, created_at=e.created_at)
        for e in entries
    ]


@router.delete("/memory/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_entry(
    entry_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    ai_service: Annotated[AIService, Depends(get_ai_service)],
) -> None:
    try:
        ai_service.delete_memory(entry_id, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
