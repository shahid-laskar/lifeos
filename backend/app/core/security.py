"""
Password hashing and JWT utilities.

Shared security infrastructure (069_Authentication_and_Authorization.md /
070_Backend_Security.md) - deliberately framework-agnostic and domain-agnostic
so any future domain needing auth (not just User) can reuse it without
duplicating cryptographic code (070 anti-pattern: "weak cryptography" /
"feature-specific security implementations").

Per ADR-004: bcrypt for password hashing (direct library, not passlib),
PyJWT for tokens. Passkeys/OAuth/MFA are explicitly deferred, not implemented
here.
"""
import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum

import bcrypt
import jwt
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()


def hash_password(plain_password: str) -> str:
    """Hash a password with bcrypt. Never store or log the plain password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Malformed hash - never crash the auth flow, just fail closed.
        return False


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


class DecodedToken(BaseModel):
    subject: str  # user id
    token_type: TokenType
    jti: str


def _create_token(subject: str, token_type: TokenType, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
        # Unique per token, regardless of issue time - fixes two tokens
        # issued within the same second being byte-identical, and gives a
        # stable handle for the future revocation list noted in ADR-004.
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject, TokenType.ACCESS, timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, TokenType.REFRESH, timedelta(days=settings.refresh_token_expire_days)
    )


class InvalidTokenError(Exception):
    """Raised for any token problem (expired, malformed, wrong type).
    Deliberately generic - per 070_Backend_Security.md, error messages to
    clients should not reveal which specific check failed (avoids helping
    an attacker probe the token format)."""


def decode_token(token: str, expected_type: TokenType) -> DecodedToken:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError("Token is invalid or expired") from exc

    token_type = payload.get("type")
    subject = payload.get("sub")
    jti = payload.get("jti")
    if token_type != expected_type.value or subject is None or jti is None:
        raise InvalidTokenError("Token is invalid or expired")

    return DecodedToken(subject=subject, token_type=TokenType(token_type), jti=jti)
