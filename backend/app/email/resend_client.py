"""Resend transactional email client. Async via httpx.

Degrades silently when RESEND_API_KEY is not set — logs a warning and
returns without calling the API. This lets the welcome email be best-effort
during OAuth callback without blocking signup or returning errors to the
user when email delivery is misconfigured.
"""

import logging
from typing import Any

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
DEFAULT_FROM = "HRScout <hola@hrscout.mx>"


class EmailError(Exception):
    """Raised on transport or API failures. Callers usually swallow."""


def is_configured() -> bool:
    return bool(get_settings().resend_api_key)


async def send_email(
    *,
    to: str | list[str],
    subject: str,
    html: str,
    from_address: str | None = None,
    reply_to: str | None = None,
    text: str | None = None,
    timeout_s: float = 10.0,
) -> dict[str, Any] | None:
    """Send a transactional email via Resend. Returns the API response or
    None if RESEND_API_KEY is missing (in which case we log + skip)."""
    settings = get_settings()
    if not settings.resend_api_key:
        log.warning(
            "Resend not configured (RESEND_API_KEY missing) — skipping email '%s'", subject
        )
        return None

    body = {
        "from": from_address or DEFAULT_FROM,
        "to": to if isinstance(to, list) else [to],
        "subject": subject,
        "html": html,
    }
    if text:
        body["text"] = text
    if reply_to:
        body["reply_to"] = reply_to

    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            response = await client.post(RESEND_URL, headers=headers, json=body)
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        raise EmailError(f"Resend network error: {exc}") from exc

    if response.status_code >= 400:
        raise EmailError(
            f"Resend returned {response.status_code}: {response.text[:200]}"
        )
    return response.json()


# ──────────────────────────────────────────────────────────── templates


WELCOME_SUBJECT = "Bienvenida a HRScout, {name} — empezá por aquí"


def welcome_html(name: str, trial_end_iso: str | None) -> str:
    first_name = (name or "").split(" ")[0] or "hola"
    trial_line = (
        f"<p>Tu prueba de 14 días termina el <strong>{trial_end_iso[:10]}</strong>. "
        "No te cobramos nada — si decides seguir, vos eliges el plan.</p>"
        if trial_end_iso else ""
    )
    return f"""<!DOCTYPE html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0B0B12;">
  <h1 style="font-size: 24px; margin: 0 0 16px;">Bienvenida, {first_name}.</h1>
  <p style="font-size: 16px; line-height: 1.5; color: #334155;">
    HRScout ya está listo para usarse. Tres cosas que podrías hacer ahora:
  </p>
  <ol style="font-size: 16px; line-height: 1.6; color: #334155;">
    <li>Crear tu primera vacante en <a href="https://hr-scout-llm.vercel.app/jobs" style="color: #6366F1;">/jobs</a></li>
    <li>Subir 3 CVs y ver los scores aparecer en segundos</li>
    <li>Si te trabas, escribime directo por WhatsApp</li>
  </ol>
  {trial_line}
  <p style="font-size: 14px; color: #64748B; margin-top: 32px;">
    — Christian (fundador de HRScout)
  </p>
  <hr style="border: none; border-top: 1px solid #CBD5E1; margin: 24px 0;"/>
  <p style="font-size: 12px; color: #64748B;">
    Recibís este email porque acabas de crear una cuenta en HRScout. Si fue un error,
    podés <a href="https://hr-scout-llm.vercel.app/login" style="color: #6366F1;">cerrar sesión</a> y
    eliminamos tus datos en 30 días.
  </p>
</body></html>"""


async def send_welcome(*, to: str, name: str, trial_ends_at_iso: str | None) -> dict | None:
    return await send_email(
        to=to,
        subject=WELCOME_SUBJECT.format(name=name.split(" ")[0] if name else "hola"),
        html=welcome_html(name, trial_ends_at_iso),
    )
