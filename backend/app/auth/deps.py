"""FastAPI dependencies for auth — extract user from session cookie."""

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_tokens import TokenError, verify_session_token
from app.db.database import get_db
from app.db.models import User

SESSION_COOKIE_NAME = "hrscout_session"


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    hrscout_session: str | None = Cookie(default=None),
) -> User:
    if not hrscout_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Cookie"},
        )
    try:
        payload = verify_session_token(hrscout_session)
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Cookie"},
        ) from exc

    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    hrscout_session: str | None = Cookie(default=None),
) -> User | None:
    """Same as get_current_user but returns None instead of 401. Useful for landing pages."""
    if not hrscout_session:
        return None
    try:
        payload = verify_session_token(hrscout_session)
    except TokenError:
        return None
    result = await db.execute(select(User).where(User.id == payload.user_id))
    return result.scalar_one_or_none()
