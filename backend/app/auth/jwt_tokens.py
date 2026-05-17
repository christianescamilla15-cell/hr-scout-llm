"""JWT minting + verification. HS256 per spec §6."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
from pydantic import BaseModel

from app.config import get_settings


class TokenError(Exception):
    """Raised when a token can't be decoded or is otherwise invalid."""


class TokenPayload(BaseModel):
    sub: str
    email: str
    plan: str
    iat: int
    exp: int

    @property
    def user_id(self) -> UUID:
        return UUID(self.sub)


def mint_session_token(
    user_id: UUID,
    email: str,
    plan: str = "trial",
    expires_in_minutes: int | None = None,
) -> str:
    settings = get_settings()
    ttl = expires_in_minutes if expires_in_minutes is not None else settings.jwt_expires_minutes
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "plan": plan,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_session_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        raw = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("Session expired. Please log in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError(f"Invalid session token: {exc}") from exc
    return TokenPayload(**raw)
