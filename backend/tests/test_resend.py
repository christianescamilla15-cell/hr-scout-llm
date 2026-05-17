"""Resend client tests — hermetic via httpx mocking."""

import json
from unittest.mock import patch

import httpx
import pytest

from app.email.resend_client import (
    EmailError,
    is_configured,
    send_email,
    send_welcome,
    welcome_html,
)


def _fake_response(payload: dict, status_code: int = 200) -> httpx.Response:
    return httpx.Response(
        status_code=status_code,
        content=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
    )


def test_welcome_html_contains_name_and_trial_date():
    html = welcome_html("Ana García", "2026-05-31T12:00:00+00:00")
    assert "Ana" in html
    assert "2026-05-31" in html
    assert "Christian" in html


def test_welcome_html_handles_missing_trial():
    html = welcome_html("Pedro Perez", None)
    assert "Pedro" in html
    # No "Tu prueba de 14 días termina" line when no trial date supplied
    assert "termina" not in html


def test_is_configured_false_without_key(monkeypatch):
    class FakeSettings:
        resend_api_key = None

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())
    assert is_configured() is False


def test_is_configured_true_with_key(monkeypatch):
    class FakeSettings:
        resend_api_key = "re_test_xyz"

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())
    assert is_configured() is True


@pytest.mark.asyncio
async def test_send_email_no_op_when_unconfigured(monkeypatch):
    """Without an API key, send_email logs a warning and returns None,
    NOT raising — this is critical for best-effort welcome emails during signup."""

    class FakeSettings:
        resend_api_key = None

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())

    result = await send_email(to="x@y.mx", subject="s", html="<p>x</p>")
    assert result is None


@pytest.mark.asyncio
async def test_send_email_happy_path(monkeypatch):
    class FakeSettings:
        resend_api_key = "re_test_xyz"

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())

    async def fake_post(self, url, **kwargs):
        return _fake_response({"id": "email_abc", "to": kwargs["json"]["to"]})

    with patch("httpx.AsyncClient.post", new=fake_post):
        result = await send_email(to="ana@example.mx", subject="hi", html="<p>hi</p>")
    assert result is not None
    assert result["id"] == "email_abc"


@pytest.mark.asyncio
async def test_send_email_raises_on_4xx(monkeypatch):
    class FakeSettings:
        resend_api_key = "re_test_xyz"

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())

    async def fake_post(self, url, **kwargs):
        return _fake_response({"error": "bad request"}, status_code=400)

    with patch("httpx.AsyncClient.post", new=fake_post):
        with pytest.raises(EmailError, match="400"):
            await send_email(to="x@y.mx", subject="s", html="<p>x</p>")


@pytest.mark.asyncio
async def test_send_welcome_passes_through(monkeypatch):
    class FakeSettings:
        resend_api_key = "re_test_xyz"

    monkeypatch.setattr("app.email.resend_client.get_settings", lambda: FakeSettings())

    captured = {}

    async def fake_post(self, url, **kwargs):
        captured.update(kwargs["json"])
        return _fake_response({"id": "welcome_id"})

    with patch("httpx.AsyncClient.post", new=fake_post):
        await send_welcome(
            to="ana@example.mx",
            name="Ana García",
            trial_ends_at_iso="2026-05-31T00:00:00+00:00",
        )

    assert captured["to"] == ["ana@example.mx"]
    assert "Ana" in captured["subject"]
    assert "Ana" in captured["html"]
