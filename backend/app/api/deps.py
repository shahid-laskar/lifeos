"""
Dependency injection wiring for the API layer.

This is the *only* place that wires a concrete repository implementation
(SqlAlchemyUserRepository) into the domain service. If we ever swap storage
engines, this file plus infrastructure/ changes - app/domain/user/ does not.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import InvalidTokenError, TokenType, decode_token
from app.domain.user.entities import UserRecord
from app.domain.user.service import UserNotFoundError, UserService

bearer_scheme = HTTPBearer(auto_error=False)


def get_user_service(db: Annotated[Session, Depends(get_db)]) -> UserService:
    # Local import avoids a module-level infrastructure->domain import cycle
    # at import time; keeps the dependency direction explicit at the call site.
    from app.infrastructure.user_repository_sqlalchemy import SqlAlchemyUserRepository, SqlAlchemyPasswordResetTokenRepository
    from app.infrastructure.console_email_service import ConsoleEmailService

    return UserService(
        repository=SqlAlchemyUserRepository(db),
        token_repository=SqlAlchemyPasswordResetTokenRepository(db),
        email_service=ConsoleEmailService(),
    )



def get_habit_service(db: Annotated[Session, Depends(get_db)]):
    from app.infrastructure.habit_repository_sqlalchemy import SqlAlchemyHabitRepository
    from app.domain.habit.service import HabitService

    return HabitService(SqlAlchemyHabitRepository(db))


def get_quran_service(db: Annotated[Session, Depends(get_db)]):
    from app.infrastructure.quran_repository_sqlalchemy import SqlAlchemyQuranRepository
    from app.domain.quran.service import QuranService

    return QuranService(SqlAlchemyQuranRepository(db))


def get_dhikr_service(db: Annotated[Session, Depends(get_db)]):
    from app.infrastructure.dhikr_repository_sqlalchemy import SqlAlchemyDhikrRepository
    from app.domain.dhikr.service import DhikrService

    return DhikrService(SqlAlchemyDhikrRepository(db))


def get_ai_service(db: Annotated[Session, Depends(get_db)]):
    from app.core.config import get_settings
    from app.domain.ai.service import AIService
    from app.infrastructure.ai_repository_sqlalchemy import ConversationRepositorySQLAlchemy, MemoryRepositorySQLAlchemy
    from app.infrastructure.ai_gateway import StubAIGateway, OpenAIGateway

    settings = get_settings()
    if settings.ai_provider == "openai" and settings.openai_api_key:
        gateway = OpenAIGateway(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url or None,
        )
    else:
        gateway = StubAIGateway()

    return AIService(
        gateway=gateway,
        conversation_repo=ConversationRepositorySQLAlchemy(db),
        memory_repo=MemoryRepositorySQLAlchemy(db),
    )


def get_family_service(db: Annotated[Session, Depends(get_db)]):
    from app.domain.family.service import FamilyService
    from app.infrastructure.family_repository_sqlalchemy import FamilyRepositorySQLAlchemy, InvitationRepositorySQLAlchemy

    return FamilyService(
        family_repo=FamilyRepositorySQLAlchemy(db),
        invitation_repo=InvitationRepositorySQLAlchemy(db),
    )



def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRecord:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        decoded = decode_token(credentials.credentials, expected_type=TokenType.ACCESS)
        return user_service.get_by_id(decoded.subject)
    except (InvalidTokenError, UserNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
