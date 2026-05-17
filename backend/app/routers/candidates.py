"""Candidates CRUD — uploaded CVs per user.

PII columns (full_name, email) are Fernet-encrypted at rest. CV text is
stored as-is because the LLM analysis pipeline needs the full document
and per spec the original PDF is never persisted.

Soft delete (`deleted_at`) supports LFPDPPP-required deletion within 20
days; a weekly cron will purge rows older than 30 days (lands in a
future commit). Day 3 ships the soft-delete mechanic; the cron is its
own concern.

PDF/DOCX upload arrives Day 5 — for now `cv_source` is locked to "paste".
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.crypto import encrypt_pii
from app.db.database import get_db
from app.db.models import Candidate, User
from app.schemas.candidates import (
    CandidateCreate,
    CandidateListResponse,
    CandidateResponse,
)

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("", response_model=CandidateListResponse)
async def list_candidates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_deleted: bool = Query(default=False),
):
    stmt = select(Candidate).where(Candidate.user_id == user.id)
    if not include_deleted:
        stmt = stmt.where(Candidate.deleted_at.is_(None))
    stmt = stmt.order_by(Candidate.created_at.desc())

    result = await db.execute(stmt)
    items = result.scalars().all()

    count_stmt = (
        select(func.count()).select_from(Candidate).where(Candidate.user_id == user.id)
    )
    if not include_deleted:
        count_stmt = count_stmt.where(Candidate.deleted_at.is_(None))
    total = (await db.execute(count_stmt)).scalar_one()

    return CandidateListResponse(
        items=[CandidateResponse.from_orm_candidate(c) for c in items],
        total=total,
    )


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    candidate = Candidate(
        user_id=user.id,
        full_name=encrypt_pii(payload.full_name),
        email=encrypt_pii(payload.email) if payload.email else None,
        cv_text=payload.cv_text,
        cv_source=payload.cv_source,
        filename=payload.filename,
        pii_encrypted=True,
    )
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return CandidateResponse.from_orm_candidate(candidate)


async def _get_owned_candidate_or_404(
    candidate_id: UUID, user: User, db: AsyncSession
) -> Candidate:
    result = await db.execute(
        select(Candidate).where(
            Candidate.id == candidate_id, Candidate.user_id == user.id
        )
    )
    candidate = result.scalar_one_or_none()
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )
    return candidate


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    candidate = await _get_owned_candidate_or_404(candidate_id, user, db)
    return CandidateResponse.from_orm_candidate(candidate)


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_candidate(
    candidate_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete — sets `deleted_at`. Hard purge is the cron's job (spec §4)."""
    candidate = await _get_owned_candidate_or_404(candidate_id, user, db)
    if candidate.deleted_at is None:
        candidate.deleted_at = datetime.now(UTC)
        await db.commit()
    return None
