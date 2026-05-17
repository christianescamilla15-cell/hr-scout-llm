"""PDF generator tests — produces real PDF bytes and asserts shape."""

from datetime import UTC, datetime

import pytest

from app.reports.pdf_generator import generate_analysis_pdf


def _sample_args(**overrides):
    base = dict(
        job_title="Backend Senior Python",
        candidate_name="Ana García",
        candidate_email="ana@example.mx",
        score=87,
        local_score=80,
        ai_score=92,
        confidence="medium",
        strengths=["Python avanzado", "FastAPI", "Liderazgo"],
        gaps=["Docker / Kubernetes"],
        verdict="Candidato fuerte con experiencia muy alineada al puesto.",
        action="interview",
        interview_question="¿Cómo manejarías una caída de producción en FastAPI?",
        analysis_mode="groq",
        created_at=datetime(2026, 5, 17, 14, 30, tzinfo=UTC),
    )
    base.update(overrides)
    return base


def test_returns_pdf_bytes():
    data = generate_analysis_pdf(**_sample_args())
    assert isinstance(data, bytes)
    assert len(data) > 1000  # real PDF is at least a few KB
    assert data.startswith(b"%PDF-"), "Output must be a real PDF (magic bytes)"


def test_handles_missing_optional_fields():
    args = _sample_args(
        candidate_name=None,
        candidate_email=None,
        verdict=None,
        action=None,
        interview_question=None,
        strengths=[],
        gaps=[],
        local_score=None,
        ai_score=None,
        confidence=None,
    )
    data = generate_analysis_pdf(**args)
    assert data.startswith(b"%PDF-")
    assert len(data) > 1000


def test_score_below_60_still_renders():
    data = generate_analysis_pdf(**_sample_args(score=42))
    assert data.startswith(b"%PDF-")


def test_score_at_boundaries():
    for score in (5, 60, 80, 98):
        data = generate_analysis_pdf(**_sample_args(score=score))
        assert data.startswith(b"%PDF-"), f"failed at score={score}"


def test_unicode_in_pii_does_not_crash():
    data = generate_analysis_pdf(
        **_sample_args(
            candidate_name="María José Núñez",
            candidate_email="maría@ejemplo.mx",
            strengths=["Liderazgo de equipos remotos en LATAM"],
            gaps=["Kubernetes a profundidad — solo ha tocado Docker básico"],
            verdict="Perfil parcialmente compatible — capacitación 1-2 meses.",
            interview_question="¿Cómo abordarías la curva de aprendizaje en K8s?",
        )
    )
    assert data.startswith(b"%PDF-")
