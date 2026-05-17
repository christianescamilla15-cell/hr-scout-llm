"""Upload endpoint tests — POST /api/candidates/upload."""

import io
from datetime import UTC, datetime, timedelta

import pytest
from docx import Document

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


def _docx_bytes(paragraphs: list[str]) -> bytes:
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


async def _seed_authed_user(db_session) -> str:
    user = User(
        email="rec@example.mx",
        name="Recruiter",
        plan="trial",
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return mint_session_token(user.id, user.email, user.plan)


@pytest.mark.asyncio
async def test_upload_requires_auth(client):
    files = {"file": ("cv.docx", b"x", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_docx_happy_path(client, db_session):
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    data = _docx_bytes([
        "Ana García",
        "ana.garcia@example.mx",
        "Senior Backend Developer",
        "5 años de experiencia con Python y PostgreSQL.",
        "Liderazgo de equipo.",
    ])
    files = {
        "file": (
            "ana_garcia_cv.docx",
            data,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 201
    body = response.json()
    assert body["cv_source"] == "docx"
    assert "Python" in body["cv_text"]
    assert body["full_name"] == "Ana García"
    assert body["email"] == "ana.garcia@example.mx"
    assert body["filename"] == "ana_garcia_cv.docx"


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_extension(client, db_session):
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    files = {"file": ("cv.txt", b"this is plain text", "text/plain")}
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_empty_file(client, db_session):
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    files = {"file": ("cv.docx", b"", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 400
    assert "Empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_oversized_file(client, db_session):
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    # 11 MB of zeros — over the 10 MB cap
    big = b"\x00" * (11 * 1024 * 1024)
    files = {
        "file": (
            "huge.docx",
            big,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 413
    assert "10 MB" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_corrupt_docx(client, db_session):
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    files = {
        "file": (
            "fake.docx",
            b"this is not a real docx file",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 400
    assert "DOCX parse failed" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_short_extracted_text(client, db_session):
    """A DOCX with almost no text should 400, not 201 with a useless row."""
    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    data = _docx_bytes(["Hi"])
    files = {
        "file": (
            "tiny.docx",
            data,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = await client.post("/api/candidates/upload", files=files)
    assert response.status_code == 400
    assert "suspiciously short" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_does_not_persist_file_bytes(client, db_session):
    """Spec §4 guarantee — we only store the extracted text, not the source bytes."""
    from sqlalchemy import select

    from app.db.models import Candidate

    token = await _seed_authed_user(db_session)
    client.cookies.set("hrscout_session", token)

    data = _docx_bytes([
        "Test User",
        "test@example.mx",
        "Senior dev with 5 years Python experience and PostgreSQL.",
    ])
    files = {
        "file": (
            "cv.docx",
            data,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    response = await client.post("/api/candidates/upload", files=files)
    candidate_id = response.json()["id"]

    row = (
        await db_session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
    ).scalar_one()
    # Only cv_text + filename stored, not the docx blob
    assert isinstance(row.cv_text, str)
    assert row.filename == "cv.docx"
    # PII fields are ciphertext (Day 3 invariant still holds via upload path)
    assert row.full_name != "Test User"
    assert row.email != "test@example.mx"
