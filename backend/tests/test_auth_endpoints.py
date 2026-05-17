"""Auth endpoint tests. Google's network calls are monkey-patched so the suite is hermetic."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


@pytest.mark.asyncio
async def test_google_start_redirects_when_configured(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    response = await client.get("/api/auth/google/start", follow_redirects=False)
    assert response.status_code == 302
    location = response.headers["location"]
    assert "accounts.google.com" in location
    assert "client_id=test-client-id" in location
    assert "scope=openid+email+profile" in location.replace("%20", "+")
    assert "state=" in location
    assert response.cookies.get("hrscout_oauth_state") is not None


@pytest.mark.asyncio
async def test_google_start_503_when_not_configured(client, monkeypatch):
    # setenv("") wins over the .env file, simulating an unconfigured deployment
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "")
    from app.config import get_settings
    get_settings.cache_clear()

    response = await client.get("/api/auth/google/start", follow_redirects=False)
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_callback_400_on_missing_code(client):
    response = await client.get("/api/auth/google/callback?state=abc", follow_redirects=False)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_callback_400_on_state_mismatch(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    client.cookies.set("hrscout_oauth_state", "expected-state")
    response = await client.get(
        "/api/auth/google/callback?code=fake&state=different-state",
        follow_redirects=False,
    )
    assert response.status_code == 400
    assert "state" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_callback_creates_user_on_first_login(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    from app.auth import oauth_google

    async def fake_exchange(_code: str):
        return {"id_token": "fake.id.token", "access_token": "fake-access"}

    def fake_verify(_id_token: str):
        return {
            "sub": "google-user-123",
            "email": "newuser@example.mx",
            "name": "New User",
            "email_verified": True,
        }

    monkeypatch.setattr(oauth_google, "exchange_code_for_tokens", fake_exchange)
    monkeypatch.setattr(oauth_google, "verify_id_token", fake_verify)

    client.cookies.set("hrscout_oauth_state", "the-state")
    response = await client.get(
        "/api/auth/google/callback?code=fake&state=the-state",
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert "/dashboard" in response.headers["location"]
    assert response.cookies.get("hrscout_session") is not None


@pytest.mark.asyncio
async def test_callback_links_existing_user_by_email(client, db_session, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    existing = User(email="ya-existo@example.mx", name="Ya Existe")
    db_session.add(existing)
    await db_session.commit()

    from app.auth import oauth_google

    async def fake_exchange(_code: str):
        return {"id_token": "fake.id.token"}

    def fake_verify(_id_token: str):
        return {
            "sub": "google-sub-9999",
            "email": "ya-existo@example.mx",
            "name": "Ya Existe",
            "email_verified": True,
        }

    monkeypatch.setattr(oauth_google, "exchange_code_for_tokens", fake_exchange)
    monkeypatch.setattr(oauth_google, "verify_id_token", fake_verify)

    client.cookies.set("hrscout_oauth_state", "s")
    response = await client.get(
        "/api/auth/google/callback?code=c&state=s",
        follow_redirects=False,
    )
    assert response.status_code == 302

    await db_session.refresh(existing)
    assert existing.google_sub == "google-sub-9999"


@pytest.mark.asyncio
async def test_me_returns_401_without_cookie(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_401_with_invalid_cookie(client):
    client.cookies.set("hrscout_session", "garbage")
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_user_with_valid_cookie(client, db_session):
    user = User(
        email="test@example.mx",
        name="Test User",
        plan="trial",
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = mint_session_token(user.id, user.email, user.plan)
    client.cookies.set("hrscout_session", token)
    response = await client.get("/api/auth/me")

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "test@example.mx"
    assert body["name"] == "Test User"
    assert body["plan"] == "trial"
    assert body["id"] == str(user.id)


@pytest.mark.asyncio
async def test_me_returns_401_when_user_deleted(client):
    token = mint_session_token(uuid4(), "ghost@example.mx", "trial")
    client.cookies.set("hrscout_session", token)
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
    assert "no longer exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_logout_clears_cookie(client, db_session):
    user = User(email="logout@example.mx", name="Logout")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = mint_session_token(user.id, user.email, user.plan)
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    # The Set-Cookie header should clear the cookie (max-age=0 or expires past)
    set_cookie = response.headers.get("set-cookie", "")
    assert "hrscout_session=" in set_cookie
