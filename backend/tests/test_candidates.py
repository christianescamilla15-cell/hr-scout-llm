from datetime import UTC, datetime, timedelta

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


CV_SAMPLE = (
    "JOSE PEREZ\nDeveloper · 5 years experience\n\n"
    "Skills: Python, FastAPI, Postgres, asyncio\n"
    "Worked at Acme 2020-2025 as Backend Lead.\n"
)


async def _make_authed_user(db_session, email: str = "rec@example.mx") -> tuple[User, str]:
    user = User(
        email=email,
        name="Recruiter",
        plan="trial",
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = mint_session_token(user.id, user.email, user.plan)
    return user, token


@pytest.mark.asyncio
async def test_list_candidates_requires_auth(client):
    response = await client.get("/api/candidates")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_candidate_encrypts_pii_in_db(client, db_session):
    """PII columns in DB must be ciphertext, NOT plaintext."""
    from sqlalchemy import select

    from app.db.models import Candidate

    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/candidates",
        json={
            "cv_text": CV_SAMPLE,
            "full_name": "Jose Perez",
            "email": "jose@example.mx",
        },
    )
    assert response.status_code == 201
    body = response.json()
    # Response carries decrypted PII for the UI
    assert body["full_name"] == "Jose Perez"
    assert body["email"] == "jose@example.mx"

    # DB row holds ciphertext
    candidate_id = body["id"]
    row = (
        await db_session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
    ).scalar_one()
    assert row.full_name != "Jose Perez"
    assert row.email != "jose@example.mx"
    assert row.pii_encrypted is True


@pytest.mark.asyncio
async def test_create_candidate_without_pii(client, db_session):
    """PII is optional; cv_text alone should be enough."""
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/candidates", json={"cv_text": CV_SAMPLE})
    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] is None
    assert body["email"] is None


@pytest.mark.asyncio
async def test_create_candidate_validates_cv_text_min_length(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/candidates", json={"cv_text": "too short"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_candidate_validates_email_format(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/candidates",
        json={"cv_text": CV_SAMPLE, "email": "not-an-email"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_then_get_candidate(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/candidates",
        json={"cv_text": CV_SAMPLE, "full_name": "Ana"},
    )
    candidate_id = created.json()["id"]

    listing = await client.get("/api/candidates")
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    single = await client.get(f"/api/candidates/{candidate_id}")
    assert single.status_code == 200
    assert single.json()["full_name"] == "Ana"


@pytest.mark.asyncio
async def test_get_candidate_404_when_other_user(client, db_session):
    _, token_a = await _make_authed_user(db_session, "ca@example.mx")
    _, token_b = await _make_authed_user(db_session, "cb@example.mx")

    client.cookies.set("hrscout_session", token_a)
    created = await client.post(
        "/api/candidates",
        json={"cv_text": CV_SAMPLE, "full_name": "Yo"},
    )
    candidate_id = created.json()["id"]

    client.cookies.set("hrscout_session", token_b)
    response = await client.get(f"/api/candidates/{candidate_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_candidate_soft_removes_from_default_list(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/candidates",
        json={"cv_text": CV_SAMPLE, "full_name": "Bye"},
    )
    candidate_id = created.json()["id"]

    delete = await client.delete(f"/api/candidates/{candidate_id}")
    assert delete.status_code == 204

    listing = await client.get("/api/candidates")
    assert listing.json()["total"] == 0

    with_deleted = await client.get("/api/candidates?include_deleted=true")
    assert with_deleted.json()["total"] == 1


@pytest.mark.asyncio
async def test_candidate_unicode_pii_roundtrip(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/candidates",
        json={
            "cv_text": CV_SAMPLE,
            "full_name": "María José Núñez",
            "email": "maria.jose@example.mx",
        },
    )
    assert response.status_code == 201
    assert response.json()["full_name"] == "María José Núñez"


@pytest.mark.asyncio
async def test_cv_text_stored_in_plaintext(client, db_session):
    """CV text is NOT encrypted — needed in plaintext for the LLM pipeline."""
    from sqlalchemy import select

    from app.db.models import Candidate

    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post("/api/candidates", json={"cv_text": CV_SAMPLE})
    candidate_id = created.json()["id"]

    row = (
        await db_session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
    ).scalar_one()
    assert row.cv_text == CV_SAMPLE
