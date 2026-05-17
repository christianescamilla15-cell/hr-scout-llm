"""Groq client tests — uses httpx mocking, no real network calls."""

import json
from unittest.mock import patch

import httpx
import pytest

from app.llm.groq import GroqError, analyze_with_groq, is_configured


def _fake_response(payload: dict, status_code: int = 200) -> httpx.Response:
    return httpx.Response(
        status_code=status_code,
        content=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
    )


@pytest.mark.asyncio
async def test_is_configured_reads_groq_api_key(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    from app.config import get_settings

    get_settings.cache_clear()
    assert is_configured() is True


@pytest.mark.asyncio
async def test_is_configured_false_when_missing(monkeypatch):
    """Patch get_settings to return a Settings with no key. Direct env override
    is unreliable because pydantic-settings still reads the .env file behind us."""
    from app import config

    class FakeSettings:
        groq_api_key = None

    monkeypatch.setattr(config, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr("app.llm.groq.get_settings", lambda: FakeSettings())
    assert is_configured() is False


@pytest.mark.asyncio
async def test_analyze_with_groq_happy_path(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    from app.config import get_settings

    get_settings.cache_clear()

    fake_content = json.dumps(
        {
            "strengths": ["Python", "React", "5 years exp"],
            "gaps": ["Docker"],
            "verdict": "Strong fit for the role",
            "action": "interview",
            "question": "How would you handle a memory leak in production?",
            "aiScore": 87,
        }
    )

    async def fake_post(self, url, **kwargs):
        return _fake_response(
            {"choices": [{"message": {"content": fake_content}}]}
        )

    with patch("httpx.AsyncClient.post", new=fake_post):
        result = await analyze_with_groq("cv", "jd", local_score=80)

    assert result.ai_score == 87
    assert "Python" in result.strengths
    assert result.action == "interview"
    assert result.latency_ms >= 0


@pytest.mark.asyncio
async def test_analyze_with_groq_unconfigured_raises(monkeypatch):
    """No GROQ_API_KEY → immediate GroqError, no network attempt."""
    class FakeSettings:
        groq_api_key = None

    monkeypatch.setattr("app.llm.groq.get_settings", lambda: FakeSettings())
    with pytest.raises(GroqError, match="not configured"):
        await analyze_with_groq("cv", "jd", local_score=50)


@pytest.mark.asyncio
async def test_analyze_with_groq_clamps_ai_score(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    from app.config import get_settings

    get_settings.cache_clear()

    fake_content = json.dumps(
        {
            "strengths": [],
            "gaps": [],
            "verdict": "",
            "action": "interview",
            "question": "",
            "aiScore": 999,  # out of range
        }
    )

    async def fake_post(self, url, **kwargs):
        return _fake_response({"choices": [{"message": {"content": fake_content}}]})

    with patch("httpx.AsyncClient.post", new=fake_post):
        result = await analyze_with_groq("cv", "jd", local_score=70)
    assert 0 <= result.ai_score <= 100


@pytest.mark.asyncio
async def test_analyze_with_groq_normalizes_invalid_action(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    from app.config import get_settings

    get_settings.cache_clear()

    fake_content = json.dumps(
        {
            "strengths": [], "gaps": [], "verdict": "", "question": "",
            "aiScore": 70, "action": "hire-immediately",  # not in allowed set
        }
    )

    async def fake_post(self, url, **kwargs):
        return _fake_response({"choices": [{"message": {"content": fake_content}}]})

    with patch("httpx.AsyncClient.post", new=fake_post):
        result = await analyze_with_groq("cv", "jd", local_score=70)
    assert result.action == "waitlist"


@pytest.mark.asyncio
async def test_analyze_with_groq_handles_4xx_no_retry(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_bad")
    from app.config import get_settings

    get_settings.cache_clear()

    async def fake_post(self, url, **kwargs):
        return _fake_response({"error": "unauthorized"}, status_code=401)

    with patch("httpx.AsyncClient.post", new=fake_post):
        with pytest.raises(GroqError, match="401"):
            await analyze_with_groq("cv", "jd", local_score=50, max_retries=2)


@pytest.mark.asyncio
async def test_analyze_with_groq_handles_bad_json(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    from app.config import get_settings

    get_settings.cache_clear()

    async def fake_post(self, url, **kwargs):
        return _fake_response(
            {"choices": [{"message": {"content": "this is not json"}}]}
        )

    with patch("httpx.AsyncClient.post", new=fake_post):
        with pytest.raises(GroqError, match="Bad Groq response"):
            await analyze_with_groq("cv", "jd", local_score=50)
