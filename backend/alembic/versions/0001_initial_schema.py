"""initial schema — users, organizations, organization_members, jobs, candidates, analyses, usage_events

Revision ID: 0001
Revises:
Create Date: 2026-05-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.db.models import GUID


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("google_sub", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("plan", sa.String(32), nullable=False, server_default="trial"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)

    op.create_table(
        "organizations",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("owner_id", GUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("plan", sa.String(32), nullable=False, server_default="agency"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "organization_members",
        sa.Column("org_id", GUID(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", GUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(32), nullable=False, server_default="member"),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "jobs",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("user_id", GUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("org_id", GUID(), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("language", sa.String(8), nullable=False, server_default="es"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])

    op.create_table(
        "candidates",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("user_id", GUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("org_id", GUID(), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("full_name", sa.Text, nullable=True),
        sa.Column("email", sa.Text, nullable=True),
        sa.Column("cv_text", sa.Text, nullable=False),
        sa.Column("cv_source", sa.String(16), nullable=False),
        sa.Column("filename", sa.String(512), nullable=True),
        sa.Column("pii_encrypted", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_candidates_user_id", "candidates", ["user_id"])

    op.create_table(
        "analyses",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("user_id", GUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("job_id", GUID(), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("candidate_id", GUID(), sa.ForeignKey("candidates.id"), nullable=False),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("local_score", sa.Integer, nullable=True),
        sa.Column("ai_score", sa.Integer, nullable=True),
        sa.Column("confidence", sa.String(16), nullable=True),
        sa.Column("strengths", sa.JSON, nullable=True),
        sa.Column("gaps", sa.JSON, nullable=True),
        sa.Column("verdict", sa.Text, nullable=True),
        sa.Column("action", sa.String(32), nullable=True),
        sa.Column("interview_question", sa.Text, nullable=True),
        sa.Column("analysis_mode", sa.String(16), nullable=False),
        sa.Column("tool_calls_used", sa.Integer, nullable=True),
        sa.Column("latency_ms", sa.Integer, nullable=True),
        sa.Column("cost_cents", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_analyses_user_created", "analyses", ["user_id", sa.text("created_at DESC")])

    op.create_table(
        "usage_events",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(sa.Integer, "sqlite"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("user_id", GUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_usage_user_month", "usage_events", ["user_id", sa.text("created_at DESC")])


def downgrade() -> None:
    op.drop_index("idx_usage_user_month", table_name="usage_events")
    op.drop_table("usage_events")
    op.drop_index("idx_analyses_user_created", table_name="analyses")
    op.drop_table("analyses")
    op.drop_index("ix_candidates_user_id", table_name="candidates")
    op.drop_table("candidates")
    op.drop_index("ix_jobs_user_id", table_name="jobs")
    op.drop_table("jobs")
    op.drop_table("organization_members")
    op.drop_table("organizations")
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
