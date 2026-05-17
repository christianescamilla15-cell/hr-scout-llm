from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.db.models import Analysis


class AnalysisCreate(BaseModel):
    job_id: UUID
    candidate_id: UUID


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    candidate_id: UUID
    score: int
    local_score: int | None = None
    ai_score: int | None = None
    confidence: str | None = None
    strengths: list[str] | None = None
    gaps: list[str] | None = None
    verdict: str | None = None
    action: str | None = None
    interview_question: str | None = None
    analysis_mode: str
    latency_ms: int | None = None
    created_at: datetime

    @classmethod
    def from_orm_analysis(cls, a: Analysis) -> "AnalysisResponse":
        return cls.model_validate(a)


class AnalysisListResponse(BaseModel):
    items: list[AnalysisResponse]
    total: int


class UsageQuotaResponse(BaseModel):
    plan: str
    used_this_period: int
    limit: int | None  # None == unlimited
    period: str  # "month" | "trial"
    blocked: bool
