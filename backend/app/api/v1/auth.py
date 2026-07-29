"""
Authentication endpoints.

Per 062_API_Architecture.md, thin controllers only: validate input, delegate
to the domain service, translate domain exceptions to HTTP responses. No
business rules here.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_user_service
from app.core.security import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.domain.user.models import (
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.domain.user.service import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserService,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens_for(user_id: str) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: UserRegisterRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> TokenResponse:
    try:
        user = user_service.register(request)
    except EmailAlreadyRegisteredError as exc:
        # Generic message - per 070_Backend_Security.md, don't confirm which
        # emails are already registered (avoids account enumeration).
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration could not be completed with the details provided.",
        ) from exc
    return _tokens_for(user.id)


@router.post("/login", response_model=TokenResponse)
def login(
    request: UserLoginRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> TokenResponse:
    try:
        user = user_service.authenticate(request.email, request.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        ) from exc
    return _tokens_for(user.id)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: RefreshRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> TokenResponse:
    try:
        decoded = decode_token(request.refresh_token, expected_type=TokenType.REFRESH)
        user = user_service.get_by_id(decoded.subject)
    except (InvalidTokenError, UserNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired. Please sign in again.",
        ) from exc
    # Note (ADR-004): refresh token is re-issued unchanged (no rotation yet).
    # Rotation + revocation list is flagged as follow-up work.
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=request.refresh_token,
    )


# ── Password Reset ────────────────────────────────────────────────────────────


@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
def request_password_reset(
    request: PasswordResetRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> dict:
    """Initiates the password reset flow.

    Returns the same generic success message regardless of whether the email
    exists in the system, to prevent email enumeration (ADR-009, Article 9).
    """
    user_service.request_password_reset(request.email)
    return {"message": "If that email is registered, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    request: PasswordResetConfirmRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> dict:
    """Completes the password reset flow using the token from the email."""
    try:
        user_service.reset_password(request.token, request.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"message": "Password successfully reset. You may now log in."}

