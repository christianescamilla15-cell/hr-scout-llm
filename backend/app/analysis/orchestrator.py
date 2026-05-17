"""Analysis orchestrator — runs local scoring + optional LLM augmentation.

Cascade per spec §3 (without the Claude tier for now — Christian deferred
Anthropic to a later commit, only Groq is wired):

  1. Always run the local scorer (it's pure, fast, free, can't fail)
  2. If Groq is configured, augment with LLM. Blend score 40% local + 60% AI.
  3. If Groq fails for any reason, return local-only with mode="local"

This means an unconfigured deployment, an outage, or a hostile API never
takes the analysis endpoint down. The product always returns *something*.
"""

import logging
from dataclasses import dataclass
from typing import Literal

from app.analysis.scorer import analyze_cv_local
from app.llm import groq as groq_client

log = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    final_score: int
    local_score: int
    ai_score: int | None
    confidence: Literal["high", "medium", "low", "n/a"]
    strengths: list[str]
    gaps: list[str]
    verdict: str
    action: str
    interview_question: str
    mode: Literal["local", "groq"]
    latency_ms: int | None


def _confidence(local_score: int, ai_score: int) -> Literal["high", "medium", "low"]:
    diff = abs(local_score - ai_score)
    if diff <= 10:
        return "high"
    if diff <= 25:
        return "medium"
    return "low"


async def run_analysis(cv_text: str, job_description: str) -> AnalysisResult:
    local = analyze_cv_local(cv_text, job_description)

    if not groq_client.is_configured():
        return AnalysisResult(
            final_score=local.score,
            local_score=local.score,
            ai_score=None,
            confidence="n/a",
            strengths=local.fortalezas,
            gaps=local.brechas,
            verdict=local.veredicto,
            action=_action_for_score(local.score),
            interview_question=local.pregunta_entrevista,
            mode="local",
            latency_ms=None,
        )

    try:
        groq = await groq_client.analyze_with_groq(
            cv_text, job_description, local_score=local.score
        )
    except groq_client.GroqError as exc:
        log.warning("Groq failed, falling back to local: %s", exc)
        return AnalysisResult(
            final_score=local.score,
            local_score=local.score,
            ai_score=None,
            confidence="n/a",
            strengths=local.fortalezas,
            gaps=local.brechas,
            verdict=local.veredicto,
            action=_action_for_score(local.score),
            interview_question=local.pregunta_entrevista,
            mode="local",
            latency_ms=None,
        )

    # Blend: 40% local + 60% LLM. Same ratio as the frontend reference.
    blended = round(local.score * 0.4 + groq.ai_score * 0.6)
    return AnalysisResult(
        final_score=blended,
        local_score=local.score,
        ai_score=groq.ai_score,
        confidence=_confidence(local.score, groq.ai_score),
        strengths=groq.strengths or local.fortalezas,
        gaps=groq.gaps or local.brechas,
        verdict=groq.verdict or local.veredicto,
        action=groq.action,
        interview_question=groq.interview_question or local.pregunta_entrevista,
        mode="groq",
        latency_ms=groq.latency_ms,
    )


def _action_for_score(score: int) -> str:
    if score >= 80:
        return "interview"
    if score >= 60:
        return "waitlist"
    return "discard"
