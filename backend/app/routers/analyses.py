"""Analyses endpoint — runs the cascade and persists the result.

Plan enforcement (spec §2):
- trial: 5 análisis lifetime (NOT monthly — trial caps cumulative usage)
- individual: 100 per calendar month
- agency: 500 per calendar month

Quota lookups go against `usage_events` so the count remains correct even
if the user deletes analyses afterwards. Every successful analysis writes
one row to `usage_events` plus one to `analyses`.
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.orchestrator import run_analysis
from app.auth.deps import get_current_user
from app.crypto import decrypt_pii
from app.db.database import get_db
from app.db.models import Analysis, Candidate, Job, UsageEvent, User
from app.reports.pdf_generator import generate_analysis_pdf
from app.schemas.analyses import (
    AnalysisCreate,
    AnalysisListResponse,
    AnalysisResponse,
    UsageQuotaResponse,
)

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

PLAN_LIMITS: dict[str, tuple[int | None, str]] = {
    "trial": (5, "trial"),
    "individual": (100, "month"),
    "agency": (500, "month"),
}


def _period_start(period: str) -> datetime | None:
    if period == "month":
        now = datetime.now(UTC)
        return datetime(now.year, now.month, 1, tzinfo=UTC)
    return None  # trial = lifetime, no time floor


async def _count_usage(db: AsyncSession, user_id: UUID, period: str) -> int:
    stmt = (
        select(func.count())
        .select_from(UsageEvent)
        .where(UsageEvent.user_id == user_id, UsageEvent.event_type == "analysis")
    )
    floor = _period_start(period)
    if floor is not None:
        stmt = stmt.where(UsageEvent.created_at >= floor)
    return (await db.execute(stmt)).scalar_one()


async def _check_quota(user: User, db: AsyncSession) -> tuple[int, int | None, str]:
    limit, period = PLAN_LIMITS.get(user.plan, (5, "trial"))
    used = await _count_usage(db, user.id, period)
    if limit is not None and used >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "quota_exceeded",
                "plan": user.plan,
                "used": used,
                "limit": limit,
                "period": period,
                "message": _quota_message(user.plan, used, limit, period),
            },
        )
    return used, limit, period


def _quota_message(plan: str, used: int, limit: int, period: str) -> str:
    if plan == "trial":
        return (
            f"Tu prueba ya usó {used} de {limit} análisis. "
            "Elegí un plan para seguir analizando candidatos."
        )
    return (
        f"Tu plan {plan} permite {limit} análisis por mes. "
        f"Llevás {used} este mes — el contador se reinicia el 1 del próximo mes."
    )


@router.get("/usage", response_model=UsageQuotaResponse)
async def get_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    limit, period = PLAN_LIMITS.get(user.plan, (5, "trial"))
    used = await _count_usage(db, user.id, period)
    return UsageQuotaResponse(
        plan=user.plan,
        used_this_period=used,
        limit=limit,
        period=period,
        blocked=(limit is not None and used >= limit),
    )


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    payload: AnalysisCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_quota(user, db)

    job = (
        await db.execute(
            select(Job).where(Job.id == payload.job_id, Job.user_id == user.id)
        )
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate = (
        await db.execute(
            select(Candidate).where(
                Candidate.id == payload.candidate_id, Candidate.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # cv_text is stored plaintext per spec §4 (LLM needs it); PII columns are encrypted
    # — but we don't pass full_name/email to the LLM, so no decrypt needed here.
    result = await run_analysis(cv_text=candidate.cv_text, job_description=job.description)

    analysis = Analysis(
        user_id=user.id,
        job_id=job.id,
        candidate_id=candidate.id,
        score=result.final_score,
        local_score=result.local_score,
        ai_score=result.ai_score,
        confidence=result.confidence,
        strengths=result.strengths,
        gaps=result.gaps,
        verdict=result.verdict,
        action=result.action,
        interview_question=result.interview_question,
        analysis_mode=result.mode,
        latency_ms=result.latency_ms,
    )
    db.add(analysis)
    db.add(UsageEvent(user_id=user.id, event_type="analysis"))
    await db.commit()
    await db.refresh(analysis)
    return AnalysisResponse.from_orm_analysis(analysis)


@router.get("", response_model=AnalysisListResponse)
async def list_analyses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    job_id: UUID | None = None,
):
    stmt = select(Analysis).where(Analysis.user_id == user.id)
    if job_id is not None:
        stmt = stmt.where(Analysis.job_id == job_id)
    stmt = stmt.order_by(Analysis.score.desc(), Analysis.created_at.desc())

    items = (await db.execute(stmt)).scalars().all()
    total = len(items)
    return AnalysisListResponse(
        items=[AnalysisResponse.from_orm_analysis(a) for a in items],
        total=total,
    )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    a = (
        await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id, Analysis.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if a is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResponse.from_orm_analysis(a)


@router.get("/{analysis_id}/report.pdf")
async def download_analysis_pdf(
    analysis_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream a single-page PDF of the analysis. Decrypts the candidate's
    PII (name + email) at render time — the PDF is the only surface where
    the recruiter sees the plaintext PII alongside the AI verdict."""
    analysis = (
        await db.execute(
            select(Analysis).where(
                Analysis.id == analysis_id, Analysis.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    job = (await db.execute(select(Job).where(Job.id == analysis.job_id))).scalar_one_or_none()
    candidate = (
        await db.execute(select(Candidate).where(Candidate.id == analysis.candidate_id))
    ).scalar_one_or_none()
    if job is None or candidate is None:
        raise HTTPException(status_code=404, detail="Related job or candidate missing")

    full_name = (
        decrypt_pii(candidate.full_name) if candidate.pii_encrypted else candidate.full_name
    )
    email = decrypt_pii(candidate.email) if candidate.pii_encrypted else candidate.email

    pdf_bytes = generate_analysis_pdf(
        job_title=job.title,
        candidate_name=full_name,
        candidate_email=email,
        score=analysis.score,
        local_score=analysis.local_score,
        ai_score=analysis.ai_score,
        confidence=analysis.confidence,
        strengths=analysis.strengths or [],
        gaps=analysis.gaps or [],
        verdict=analysis.verdict,
        action=analysis.action,
        interview_question=analysis.interview_question,
        analysis_mode=analysis.analysis_mode,
        created_at=analysis.created_at,
    )

    # Track as a separate usage event so plan-Agency PDF caps can be added later
    db.add(UsageEvent(user_id=user.id, event_type="pdf_export"))
    await db.commit()

    filename_safe = (full_name or "candidato").replace(" ", "_").replace("/", "_")[:80]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="hrscout_{filename_safe}.pdf"',
            "Cache-Control": "private, no-store",
        },
    )
