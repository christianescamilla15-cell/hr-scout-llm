from datetime import UTC, datetime, timedelta

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


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
async def test_list_jobs_requires_auth(client):
    response = await client.get("/api/jobs")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_job(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    create = await client.post(
        "/api/jobs",
        json={
            "title": "Backend Senior",
            "description": "FastAPI + Postgres + asyncio. 5 años exp.",
            "language": "es",
        },
    )
    assert create.status_code == 201
    created = create.json()
    assert created["title"] == "Backend Senior"
    assert created["language"] == "es"
    assert "id" in created

    listing = await client.get("/api/jobs")
    assert listing.status_code == 200
    body = listing.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == created["id"]


@pytest.mark.asyncio
async def test_create_job_validates_title_length(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/jobs", json={"title": "A", "description": "Description long enough for spec"}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_job_validates_description_length(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/jobs", json={"title": "Backend", "description": "short"}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_job_404_when_other_user(client, db_session):
    """Ownership enforcement — user A creates, user B 404s."""
    user_a, token_a = await _make_authed_user(db_session, "a@example.mx")
    _, token_b = await _make_authed_user(db_session, "b@example.mx")

    client.cookies.set("hrscout_session", token_a)
    created = await client.post(
        "/api/jobs",
        json={"title": "Mine", "description": "Description long enough for spec"},
    )
    job_id = created.json()["id"]

    client.cookies.set("hrscout_session", token_b)
    response = await client.get(f"/api/jobs/{job_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_job_partial_update(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/jobs",
        json={"title": "Old title", "description": "Description long enough for spec"},
    )
    job_id = created.json()["id"]

    updated = await client.patch(f"/api/jobs/{job_id}", json={"title": "New title"})
    assert updated.status_code == 200
    assert updated.json()["title"] == "New title"
    # description preserved
    assert updated.json()["description"] == "Description long enough for spec"


@pytest.mark.asyncio
async def test_patch_job_400_on_empty_payload(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/jobs",
        json={"title": "Title", "description": "Description long enough for spec"},
    )
    job_id = created.json()["id"]

    response = await client.patch(f"/api/jobs/{job_id}", json={})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_job_soft_archives(client, db_session):
    _, token = await _make_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    created = await client.post(
        "/api/jobs",
        json={"title": "To delete", "description": "Description long enough for spec"},
    )
    job_id = created.json()["id"]

    delete = await client.delete(f"/api/jobs/{job_id}")
    assert delete.status_code == 204

    # No longer in default listing
    listing = await client.get("/api/jobs")
    assert listing.json()["total"] == 0

    # Still visible with include_archived
    archived = await client.get("/api/jobs?include_archived=true")
    assert archived.json()["total"] == 1


@pytest.mark.asyncio
async def test_list_jobs_returns_only_my_jobs(client, db_session):
    _, token_a = await _make_authed_user(db_session, "a2@example.mx")
    _, token_b = await _make_authed_user(db_session, "b2@example.mx")

    client.cookies.set("hrscout_session", token_a)
    await client.post(
        "/api/jobs",
        json={"title": "A's job", "description": "Description long enough for spec"},
    )

    client.cookies.set("hrscout_session", token_b)
    listing = await client.get("/api/jobs")
    assert listing.json()["total"] == 0
