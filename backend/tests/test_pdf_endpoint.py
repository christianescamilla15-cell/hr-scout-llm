"""End-to-end test of GET /api/analyses/{id}/report.pdf."""

from datetime import UTC, datetime, timedelta

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.crypto import encrypt_pii
from app.db.models import Analysis, Candidate, Job, User


async def _seed_full_pipeline(db_session) -> tuple[User, str, str]:
    user = User(
        email="rec@example.mx",
        name="Recruiter",
        plan="trial",
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
    )
    db_session.add(user)
    await db_session.flush()

    job = Job(
        user_id=user.id,
        title="Backend Senior",
        description="Python + FastAPI + Postgres",
        language="es",
    )
    candidate = Candidate(
        user_id=user.id,
        full_name=encrypt_pii("Ana García López"),
        email=encrypt_pii("ana@example.mx"),
        cv_text="CV de Ana — 5 anos Python FastAPI...",
        cv_source="paste",
        pii_encrypted=True,
    )
    db_session.add_all([job, candidate])
    await db_session.flush()

    analysis = Analysis(
        user_id=user.id,
        job_id=job.id,
        candidate_id=candidate.id,
        score=87,
        local_score=80,
        ai_score=92,
        confidence="medium",
        strengths=["Python", "FastAPI"],
        gaps=["Docker"],
        verdict="Candidato fuerte.",
        action="interview",
        interview_question="¿Cómo manejarías un memory leak?",
        analysis_mode="groq",
        latency_ms=3200,
    )
    db_session.add(analysis)
    await db_session.commit()
    await db_session.refresh(analysis)
    token = mint_session_token(user.id, user.email, user.plan)
    return user, str(analysis.id), token


@pytest.mark.asyncio
async def test_pdf_requires_auth(client):
    response = await client.get("/api/analyses/00000000-0000-0000-0000-000000000001/report.pdf")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_pdf_404_for_unknown_analysis(client, db_session):
    user = User(email="x@y.mx", name="X", plan="trial")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    client.cookies.set("hrscout_session", mint_session_token(user.id, user.email, user.plan))

    response = await client.get(
        "/api/analyses/00000000-0000-0000-0000-000000000099/report.pdf"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_pdf_happy_path_streams_pdf_bytes(client, db_session):
    _, analysis_id, token = await _seed_full_pipeline(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.get(f"/api/analyses/{analysis_id}/report.pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"].lower()
    assert "ana_garc" in response.headers["content-disposition"].lower()  # name in filename
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 1000


@pytest.mark.asyncio
async def test_pdf_404_for_other_users_analysis(client, db_session):
    _, analysis_id, _ = await _seed_full_pipeline(db_session)
    # Different user
    other = User(email="other@y.mx", name="Other", plan="trial")
    db_session.add(other)
    await db_session.commit()
    await db_session.refresh(other)
    client.cookies.set("hrscout_session", mint_session_token(other.id, other.email, other.plan))

    response = await client.get(f"/api/analyses/{analysis_id}/report.pdf")
    assert response.status_code == 404
