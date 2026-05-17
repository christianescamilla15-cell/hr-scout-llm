"""Groq llama-3.3-70b client. Free tier, fast, OpenAI-compatible API.

Used as the first hop of the cascade: Groq → (Claude later) → local.
"""

import asyncio
import json
import logging
from dataclasses import dataclass

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


class GroqError(Exception):
    """Raised on any non-retryable Groq failure (config, auth, parse)."""


def is_configured() -> bool:
    return bool(get_settings().groq_api_key)


@dataclass
class GroqAnalysis:
    strengths: list[str]
    gaps: list[str]
    verdict: str
    action: str  # interview | waitlist | discard
    interview_question: str
    ai_score: int
    latency_ms: int


_SYSTEM_PROMPT = (
    "Eres un analista de RRHH. Analiza el CV del candidato contra el job "
    "description. Responde EN JSON SIN MARKDOWN con esta forma exacta: "
    '{"strengths":["s1","s2","s3"],"gaps":["g1","g2","g3"],'
    '"verdict":"resumen 2 lineas","action":"interview|waitlist|discard",'
    '"question":"pregunta especifica de entrevista","aiScore":0-100}'
)


def _build_user_message(cv_text: str, job_description: str, local_score: int) -> str:
    return (
        f"Job:\n{job_description}\n\n"
        f"CV del candidato:\n{cv_text}\n\n"
        f"Score local de referencia (palabras clave): {local_score}/100"
    )


async def analyze_with_groq(
    cv_text: str,
    job_description: str,
    local_score: int,
    *,
    max_retries: int = 1,
    timeout_s: float = 15.0,
) -> GroqAnalysis:
    settings = get_settings()
    if not settings.groq_api_key:
        raise GroqError("GROQ_API_KEY not configured")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.groq_api_key}",
    }
    body = {
        "model": GROQ_MODEL,
        "max_tokens": 800,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(cv_text, job_description, local_score)},
        ],
    }

    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        start = asyncio.get_event_loop().time()
        try:
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                response = await client.post(GROQ_URL, headers=headers, json=body)
            elapsed = int((asyncio.get_event_loop().time() - start) * 1000)

            if response.status_code != 200:
                # 5xx is retryable, 4xx is not
                if response.status_code >= 500 and attempt < max_retries:
                    last_err = GroqError(f"HTTP {response.status_code}")
                    await asyncio.sleep(0.5 * (2 ** attempt))
                    continue
                raise GroqError(
                    f"Groq returned {response.status_code}: {response.text[:200]}"
                )

            payload = response.json()
            content = payload.get("choices", [{}])[0].get("message", {}).get("content")
            if not content:
                raise GroqError("Groq response missing message.content")
            data = json.loads(content)

            ai_score = max(0, min(100, int(data.get("aiScore", local_score))))
            action = data.get("action", "waitlist")
            if action not in {"interview", "waitlist", "discard"}:
                action = "waitlist"

            return GroqAnalysis(
                strengths=list(data.get("strengths", []))[:5],
                gaps=list(data.get("gaps", []))[:5],
                verdict=str(data.get("verdict", "")).strip()[:500],
                action=action,
                interview_question=str(data.get("question", "")).strip()[:500],
                ai_score=ai_score,
                latency_ms=elapsed,
            )
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_err = exc
            if attempt < max_retries:
                await asyncio.sleep(0.5 * (2 ** attempt))
                continue
            raise GroqError(f"Network error after retries: {exc}") from exc
        except (json.JSONDecodeError, ValueError, KeyError) as exc:
            raise GroqError(f"Bad Groq response shape: {exc}") from exc

    raise GroqError(f"Exhausted retries: {last_err}")
