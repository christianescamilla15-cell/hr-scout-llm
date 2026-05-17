from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import CHAR, TypeDecorator

from app.db.database import Base


class GUID(TypeDecorator):
    """UUID type that works on both Postgres (native UUID) and SQLite (CHAR(36))."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PgUUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value if isinstance(value, UUID) else UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value if isinstance(value, UUID) else UUID(str(value))


def _utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(32), nullable=False, default="trial")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    jobs: Mapped[list["Job"]] = relationship(back_populates="user")
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="user")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="user")
    owned_orgs: Mapped[list["Organization"]] = relationship(back_populates="owner")


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), nullable=False, default="agency")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    owner: Mapped[User] = relationship(back_populates="owned_orgs")
    members: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    org_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="member")
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="members")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    org_id: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("organizations.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="es")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="jobs")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="job")


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    org_id: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("organizations.id"), nullable=True)
    # full_name and email are Fernet-encrypted at the application layer before INSERT
    # (handled by the candidates router in Phase 1 Day 3). Storing as text — the cipher
    # is base64-safe ascii.
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    cv_text: Mapped[str] = mapped_column(Text, nullable=False)
    cv_source: Mapped[str] = mapped_column(String(16), nullable=False)  # paste | pdf | docx
    filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    pii_encrypted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="candidates")
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="candidate")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    job_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("jobs.id"), nullable=False)
    candidate_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("candidates.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    local_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(16), nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    gaps: Mapped[list | None] = mapped_column(JSON, nullable=True)
    verdict: Mapped[str | None] = mapped_column(Text, nullable=True)
    action: Mapped[str | None] = mapped_column(String(32), nullable=True)
    interview_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_mode: Mapped[str] = mapped_column(String(16), nullable=False)
    tool_calls_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="analyses")
    job: Mapped[Job] = relationship(back_populates="analyses")
    candidate: Mapped[Candidate] = relationship(back_populates="analyses")


class UsageEvent(Base):
    __tablename__ = "usage_events"

    # BigInteger doesn't auto-increment on SQLite (only INTEGER PRIMARY KEY does).
    # The variant keeps Postgres BIGINT while letting SQLite use INTEGER, so tests
    # work with the in-memory SQLite fixture.
    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)


# Composite + filtered indexes (Postgres) / regular indexes (SQLite)
Index("idx_analyses_user_created", Analysis.user_id, Analysis.created_at.desc())
Index("idx_jobs_user_active", Job.user_id, postgresql_where=Job.archived_at.is_(None))
Index(
    "idx_candidates_user_active",
    Candidate.user_id,
    postgresql_where=Candidate.deleted_at.is_(None),
)
Index("idx_usage_user_month", UsageEvent.user_id, UsageEvent.created_at.desc())
