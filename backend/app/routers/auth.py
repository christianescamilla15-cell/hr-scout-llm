"""Auth endpoints — Google OAuth + JWT cookie session.

Spec: §5 (auth endpoints) + §6 (auth flow). Session token lives in an
httpOnly+SameSite=Lax cookie so XSS can't read it and CSRF needs both
the cookie AND a same-site origin.

Email/password signup arrives in a later commit. This file ships only
the Google flow because Christian's audience (reclutadoras MX) lives on
Google Workspace.
"""

import logging
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import oauth_google
from app.auth.deps import SESSION_COOKIE_NAME, get_current_user
from app.auth.jwt_tokens import mint_session_token
from app.config import get_settings
from app.db.database import get_db
from app.db.models import User
from app.email import resend_client

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

OAUTH_STATE_COOKIE = "hrscout_oauth_state"
TRIAL_DURATION_DAYS = 14


class MeResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    trial_ends_at: datetime | None
    created_at: datetime

    @classmethod
    def from_user(cls, user: User) -> "MeResponse":
        return cls(
            id=str(user.id),
            email=user.email,
            name=user.name,
            plan=user.plan,
            trial_ends_at=user.trial_ends_at,
            created_at=user.created_at,
        )


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.jwt_expires_minutes * 60,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
    )


@router.get("/google/start")
async def google_start(response: Response):
    """Kick off Google OAuth — set a state cookie and redirect to Google's consent screen."""
    if not oauth_google.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured on this server.",
        )
    state = token_urlsafe(32)
    settings = get_settings()
    redirect = RedirectResponse(oauth_google.build_authorize_url(state), status_code=302)
    redirect.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        max_age=10 * 60,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        path="/",
    )
    return redirect


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    oauth_state: str | None = Cookie(default=None, alias=OAUTH_STATE_COOKIE),
    db: AsyncSession = Depends(get_db),
):
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google returned an error: {error}",
        )
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code or state in callback.",
        )
    if not oauth_state or oauth_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state mismatch — possible CSRF.",
        )

    try:
        tokens = await oauth_google.exchange_code_for_tokens(code)
        claims = oauth_google.verify_id_token(tokens["id_token"])
    except oauth_google.OAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    google_sub = claims["sub"]
    email = claims["email"]
    name = claims.get("name") or email.split("@")[0]

    # Upsert: prefer google_sub match, fall back to email match (account-linking).
    is_new_user = False
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                email=email,
                name=name,
                google_sub=google_sub,
                plan="trial",
                trial_ends_at=datetime.now(UTC) + timedelta(days=TRIAL_DURATION_DAYS),
            )
            db.add(user)
            is_new_user = True
        else:
            user.google_sub = google_sub
            if not user.name:
                user.name = name
    await db.commit()
    await db.refresh(user)

    # Best-effort welcome email for brand-new users. Failures are logged but
    # don't block the login redirect — the user shouldn't see "email service
    # down" when they successfully signed in.
    if is_new_user and resend_client.is_configured():
        try:
            await resend_client.send_welcome(
                to=user.email,
                name=user.name,
                trial_ends_at_iso=user.trial_ends_at.isoformat() if user.trial_ends_at else None,
            )
        except resend_client.EmailError as exc:
            log.warning("Welcome email failed for %s: %s", user.email, exc)

    token = mint_session_token(user.id, user.email, user.plan)
    settings = get_settings()
    redirect = RedirectResponse(settings.frontend_post_login_url, status_code=302)
    _set_session_cookie(redirect, token)
    redirect.delete_cookie(key=OAUTH_STATE_COOKIE, path="/")
    return redirect


@router.post("/logout")
async def logout(response: Response):
    _clear_session_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
async def me(user: User = Depends(get_current_user)):
    return MeResponse.from_user(user)
