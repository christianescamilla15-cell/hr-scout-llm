"""Jobs CRUD — saved job descriptions per user.

All endpoints require authentication. Ownership is enforced at the query
level (every SELECT filters by `Job.user_id == current_user.id`) so a
leaked job ID can't be used by another user to read or mutate.
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.db.database import get_db
from app.db.models import Job, User
from app.schemas.jobs import JobCreate, JobListResponse, JobResponse, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_archived: bool = False,
):
    stmt = select(Job).where(Job.user_id == user.id)
    if not include_archived:
        stmt = stmt.where(Job.archived_at.is_(None))
    stmt = stmt.order_by(Job.created_at.desc())

    result = await db.execute(stmt)
    items = result.scalars().all()

    count_stmt = select(func.count()).select_from(Job).where(Job.user_id == user.id)
    if not include_archived:
        count_stmt = count_stmt.where(Job.archived_at.is_(None))
    total = (await db.execute(count_stmt)).scalar_one()

    return JobListResponse(
        items=[JobResponse.from_orm_job(j) for j in items],
        total=total,
    )


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = Job(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        language=payload.language,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return JobResponse.from_orm_job(job)


async def _get_owned_job_or_404(job_id: UUID, user: User, db: AsyncSession) -> Job:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job_or_404(job_id, user, db)
    return JobResponse.from_orm_job(job)


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    payload: JobUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job_or_404(job_id, user, db)
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided",
        )
    for k, v in fields.items():
        setattr(job, k, v)
    await db.commit()
    await db.refresh(job)
    return JobResponse.from_orm_job(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_job(
    job_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete via `archived_at`. Spec §4 keeps the row for analytics."""
    job = await _get_owned_job_or_404(job_id, user, db)
    if job.archived_at is None:
        job.archived_at = datetime.now(UTC)
        await db.commit()
    return None
