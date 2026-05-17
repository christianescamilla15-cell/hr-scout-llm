from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import Job


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=10)
    language: Literal["es", "en"] = "es"


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=10)
    language: Literal["es", "en"] | None = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    language: str
    created_at: datetime
    archived_at: datetime | None = None

    @classmethod
    def from_orm_job(cls, job: Job) -> "JobResponse":
        return cls.model_validate(job)


class JobListResponse(BaseModel):
    items: list[JobResponse]
    total: int
