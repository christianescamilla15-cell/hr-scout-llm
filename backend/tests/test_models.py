from uuid import uuid4

import pytest

from app.db.models import Analysis, Candidate, Job, Organization, OrganizationMember, User, UsageEvent


@pytest.mark.asyncio
async def test_create_user(db_session):
    user = User(email="ana@example.mx", name="Ana Pérez")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    assert user.id is not None
    assert user.plan == "trial"


@pytest.mark.asyncio
async def test_user_email_unique(db_session):
    db_session.add(User(email="dup@example.mx", name="A"))
    await db_session.commit()
    db_session.add(User(email="dup@example.mx", name="B"))
    with pytest.raises(Exception):
        await db_session.commit()


@pytest.mark.asyncio
async def test_create_full_pipeline(db_session):
    """User → org → job → candidate → analysis → usage_event end-to-end create."""
    user = User(email="recruiter@example.mx", name="Recruiter")
    db_session.add(user)
    await db_session.flush()

    org = Organization(name="Acme Talent", owner_id=user.id, plan="agency")
    db_session.add(org)
    await db_session.flush()

    member = OrganizationMember(org_id=org.id, user_id=user.id, role="owner")
    db_session.add(member)

    job = Job(
        user_id=user.id,
        org_id=org.id,
        title="Backend Python Senior",
        description="FastAPI + Postgres + async",
        language="es",
    )
    db_session.add(job)
    await db_session.flush()

    candidate = Candidate(
        user_id=user.id,
        org_id=org.id,
        cv_text="Pretend CV text",
        cv_source="paste",
    )
    db_session.add(candidate)
    await db_session.flush()

    analysis = Analysis(
        user_id=user.id,
        job_id=job.id,
        candidate_id=candidate.id,
        score=87,
        local_score=80,
        ai_score=90,
        confidence="high",
        strengths=["FastAPI", "async"],
        gaps=["Kubernetes"],
        verdict="Strong fit",
        action="interview",
        analysis_mode="claude",
        latency_ms=3200,
    )
    db_session.add(analysis)

    usage = UsageEvent(user_id=user.id, event_type="analysis")
    db_session.add(usage)

    await db_session.commit()
    await db_session.refresh(analysis)

    assert analysis.id is not None
    assert analysis.strengths == ["FastAPI", "async"]
    assert analysis.score == 87


@pytest.mark.asyncio
async def test_guid_roundtrip_on_sqlite(db_session):
    """GUID TypeDecorator should accept UUID and return UUID on SQLite."""
    user_id = uuid4()
    user = User(id=user_id, email="guid@example.mx", name="GUID")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    assert user.id == user_id
    assert type(user.id).__name__ == "UUID"
