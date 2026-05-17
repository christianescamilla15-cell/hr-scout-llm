from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.crypto import decrypt_pii
from app.db.models import Candidate


class CandidateCreate(BaseModel):
    cv_text: str = Field(min_length=50, max_length=200_000)
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    filename: str | None = Field(default=None, max_length=512)
    # PDF/DOCX upload arrives Day 5; for now everything is paste
    cv_source: Literal["paste"] = "paste"


class CandidateResponse(BaseModel):
    id: UUID
    full_name: str | None = None
    email: str | None = None
    cv_text: str
    cv_source: str
    filename: str | None = None
    created_at: datetime

    @classmethod
    def from_orm_candidate(cls, candidate: Candidate) -> "CandidateResponse":
        # Decrypt PII at response-render time. The DB rows hold ciphertext.
        return cls(
            id=candidate.id,
            full_name=decrypt_pii(candidate.full_name) if candidate.pii_encrypted else candidate.full_name,
            email=decrypt_pii(candidate.email) if candidate.pii_encrypted else candidate.email,
            cv_text=candidate.cv_text,
            cv_source=candidate.cv_source,
            filename=candidate.filename,
            created_at=candidate.created_at,
        )


class CandidateListResponse(BaseModel):
    items: list[CandidateResponse]
    total: int
