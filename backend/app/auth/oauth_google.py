"""Google OAuth 2.0 client — authorize URL builder + code exchange + id_token verification."""

from typing import Any
from urllib.parse import urlencode

import httpx
from google.auth.transport import requests as g_requests
from google.oauth2 import id_token as g_id_token

from app.config import get_settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = ["openid", "email", "profile"]


class OAuthError(Exception):
    """Raised when the OAuth dance fails (config missing, code rejected, id_token bad)."""


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.google_client_id and settings.google_client_secret)


def build_authorize_url(state: str) -> str:
    settings = get_settings()
    if not is_configured():
        raise OAuthError("Google OAuth not configured (missing client id/secret)")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.oauth_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "online",
        "include_granted_scopes": "true",
        "state": state,
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    """Exchange an authorization code for an access_token + id_token."""
    settings = get_settings()
    if not is_configured():
        raise OAuthError("Google OAuth not configured")
    data = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.oauth_redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=data)
    if response.status_code != 200:
        raise OAuthError(
            f"Token exchange failed ({response.status_code}): {response.text[:200]}"
        )
    payload = response.json()
    if "id_token" not in payload:
        raise OAuthError("Token response missing id_token")
    return payload


def verify_id_token(id_token_str: str) -> dict[str, Any]:
    """Verify a Google id_token's signature + audience. Returns the decoded claims."""
    settings = get_settings()
    if not settings.google_client_id:
        raise OAuthError("Cannot verify id_token without GOOGLE_CLIENT_ID")
    try:
        claims = g_id_token.verify_oauth2_token(
            id_token_str,
            g_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise OAuthError(f"id_token verification failed: {exc}") from exc

    if not claims.get("email_verified"):
        raise OAuthError("Google did not verify this email address")
    return claims
