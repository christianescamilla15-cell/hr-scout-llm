"""Analyses endpoint tests — uses local-only mode (GROQ unconfigured) so the
suite is hermetic. The Groq path itself is covered by test_groq.py."""

from datetime import UTC, datetime, timedelta

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


CV_PYTHON = (
    "Ana Garcia\nSenior Backend Developer\n5 años de experiencia\n"
    "Python, FastAPI, Postgres, asyncio\nLiderazgo de equipo\n"
)
JD_BACKEND = (
    "Backend Senior\nRequisitos obligatorios:\nPython\nSQL\n3+ años de experiencia"
)


async def _seed_user_job_candidate(
    db_session, plan: str = "trial"
) -> tuple[User, str, str, str]:
    """Returns (user, token, job_id, candidate_id) — all created via DB to skip API setup."""
    from sqlalchemy import select

    from app.db.models import Candidate, Job

    user = User(
        email="rec@example.mx",
        name="Recruiter",
        plan=plan,
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
    )
    db_session.add(user)
    await db_session.flush()

    job = Job(
        user_id=user.id,
        title="Backend Senior",
        description=JD_BACKEND,
        language="es",
    )
    candidate = Candidate(
        user_id=user.id,
        cv_text=CV_PYTHON,
        cv_source="paste",
        pii_encrypted=True,
    )
    db_session.add_all([job, candidate])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(job)
    await db_session.refresh(candidate)
    token = mint_session_token(user.id, user.email, user.plan)

    # Confirm DB matches via re-fetch
    return user, token, str(job.id), str(candidate.id)


@pytest.mark.asyncio
async def test_create_analysis_requires_auth(client):
    response = await client.post(
        "/api/analyses",
        json={
            "job_id": "00000000-0000-0000-0000-000000000001",
            "candidate_id": "00000000-0000-0000-0000-000000000002",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_analysis_local_mode_happy_path(client, db_session, monkeypatch):
    """No GROQ_API_KEY → orchestrator runs local-only and persists result."""
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    user, token, job_id, candidate_id = await _seed_user_job_candidate(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/analyses", json={"job_id": job_id, "candidate_id": candidate_id}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["analysis_mode"] == "local"
    assert 5 <= body["score"] <= 98
    assert body["ai_score"] is None
    assert body["confidence"] == "n/a"
    assert body["action"] in {"interview", "waitlist", "discard"}
    assert body["job_id"] == job_id
    assert body["candidate_id"] == candidate_id


@pytest.mark.asyncio
async def test_create_analysis_404_on_other_users_job(client, db_session, monkeypatch):
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    _user_a, token_a, _job_a, candidate_a = await _seed_user_job_candidate(db_session)
    # Create a second user with their own job
    other = User(email="other@example.mx", name="Other", plan="trial")
    db_session.add(other)
    await db_session.commit()
    await db_session.refresh(other)
    other_token = mint_session_token(other.id, other.email, other.plan)
    client.cookies.set("hrscout_session", other_token)

    response = await client.post(
        "/api/analyses", json={"job_id": _job_a, "candidate_id": candidate_a}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_quota_blocks_after_trial_limit(client, db_session, monkeypatch):
    """Trial = 5 lifetime analyses. The 6th must return 402."""
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    user, token, job_id, candidate_id = await _seed_user_job_candidate(db_session, plan="trial")
    client.cookies.set("hrscout_session", token)

    payload = {"job_id": job_id, "candidate_id": candidate_id}
    for _ in range(5):
        r = await client.post("/api/analyses", json=payload)
        assert r.status_code == 201

    sixth = await client.post("/api/analyses", json=payload)
    assert sixth.status_code == 402
    detail = sixth.json()["detail"]
    assert detail["code"] == "quota_exceeded"
    assert detail["used"] == 5
    assert detail["limit"] == 5


@pytest.mark.asyncio
async def test_individual_plan_allows_more(client, db_session, monkeypatch):
    """Individual plan has a 100/month cap — first analysis should pass even if
    the same user would have been blocked on trial."""
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    user, token, job_id, candidate_id = await _seed_user_job_candidate(
        db_session, plan="individual"
    )
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/analyses", json={"job_id": job_id, "candidate_id": candidate_id}
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_usage_endpoint_reflects_count(client, db_session, monkeypatch):
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    user, token, job_id, candidate_id = await _seed_user_job_candidate(db_session)
    client.cookies.set("hrscout_session", token)

    initial = await client.get("/api/analyses/usage")
    assert initial.status_code == 200
    assert initial.json()["used_this_period"] == 0
    assert initial.json()["limit"] == 5
    assert initial.json()["blocked"] is False

    await client.post(
        "/api/analyses", json={"job_id": job_id, "candidate_id": candidate_id}
    )

    after = await client.get("/api/analyses/usage")
    assert after.json()["used_this_period"] == 1
    assert after.json()["blocked"] is False


@pytest.mark.asyncio
async def test_list_and_get_single_analysis(client, db_session, monkeypatch):
    # Force orchestrator into local-only mode (pydantic-settings keeps reading
    # .env behind monkeypatched env vars, so we patch the configured-check directly)
    monkeypatch.setattr("app.llm.groq.is_configured", lambda: False)
    monkeypatch.setattr("app.analysis.orchestrator.groq_client.is_configured", lambda: False)

    user, token, job_id, candidate_id = await _seed_user_job_candidate(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/analyses", json={"job_id": job_id, "candidate_id": candidate_id}
    )
    analysis_id = created.json()["id"]

    listing = await client.get("/api/analyses")
    assert listing.json()["total"] == 1

    by_job = await client.get(f"/api/analyses?job_id={job_id}")
    assert by_job.json()["total"] == 1

    single = await client.get(f"/api/analyses/{analysis_id}")
    assert single.status_code == 200
    assert single.json()["id"] == analysis_id
