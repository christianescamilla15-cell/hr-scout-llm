"""Billing endpoints — Stripe Checkout + Customer Portal + Webhook.

Spec §5 + §7. The webhook is the source of truth: we never trust
client-side state. When checkout completes (or a sub is cancelled),
Stripe POSTs to /api/billing/webhook and we sync `users.plan` from
the payload after verifying the signature.

If STRIPE_SECRET_KEY is missing, /checkout and /portal return 503 with
a clear message so the frontend can show a "Billing temporarily
unavailable" banner instead of a confusing error.
"""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.billing import stripe_client
from app.billing.plans import lookup_key_for_plan_interval, plan_for_price
from app.config import get_settings
from app.db.database import get_db
from app.db.models import User
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PortalResponse,
    WebhookAckResponse,
)

router = APIRouter(prefix="/api/billing", tags=["billing"])
log = logging.getLogger(__name__)


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not stripe_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing not configured on this server.",
        )

    price_id = lookup_key_for_plan_interval(payload.plan, payload.interval)
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Price for plan={payload.plan} interval={payload.interval} not configured. "
            "Run scripts/setup_stripe.py.",
        )

    try:
        customer_id = stripe_client.get_or_create_customer(
            email=user.email,
            name=user.name,
            existing_id=user.stripe_customer_id,
        )
    except stripe_client.BillingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if user.stripe_customer_id != customer_id:
        user.stripe_customer_id = customer_id
        await db.commit()

    settings = get_settings()
    try:
        session = stripe_client.create_checkout_session(
            customer_id=customer_id,
            price_id=price_id,
            success_url=settings.frontend_billing_success_url,
            cancel_url=settings.frontend_billing_cancel_url,
            user_id=str(user.id),
        )
    except stripe_client.BillingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return CheckoutResponse(session_id=session["id"], url=session["url"])


@router.post("/portal", response_model=PortalResponse)
async def create_portal(
    user: User = Depends(get_current_user),
):
    if not stripe_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing not configured on this server.",
        )
    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer linked to this account. Start a checkout first.",
        )

    settings = get_settings()
    try:
        session = stripe_client.create_portal_session(
            customer_id=user.stripe_customer_id,
            return_url=settings.frontend_billing_portal_return_url,
        )
    except stripe_client.BillingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return PortalResponse(url=session["url"])


# ──────────────────────────────────────────────────────────── Webhook
# Stripe signs the raw body. We MUST read the request bytes, NOT a parsed
# JSON, because any re-serialization changes the bytes and breaks the HMAC.


async def _handle_checkout_completed(event_data: dict, db: AsyncSession) -> str:
    """checkout.session.completed → set user.plan based on the price selected."""
    session = event_data["object"]
    user_id = session.get("client_reference_id")
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    if not user_id or not subscription_id:
        return "skipped: missing client_reference_id or subscription"

    sub = stripe_client.fetch_subscription(subscription_id)
    items = sub.get("items", {}).get("data", [])
    if not items:
        return f"skipped: subscription {subscription_id} has no items"
    price_id = items[0]["price"]["id"]
    plan = plan_for_price(price_id)
    if plan is None:
        return f"skipped: unknown price {price_id}"

    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        log.warning("Webhook for nonexistent user %s", user_id)
        return "skipped: user not found"

    user.plan = plan
    user.stripe_customer_id = customer_id
    user.stripe_subscription_id = subscription_id
    user.trial_ends_at = None  # paid users don't have a trial countdown
    await db.commit()
    return f"upgraded user {user_id} to {plan}"


async def _handle_subscription_updated(event_data: dict, db: AsyncSession) -> str:
    sub = event_data["object"]
    subscription_id = sub["id"]
    items = sub.get("items", {}).get("data", [])
    if not items:
        return f"skipped: subscription {subscription_id} has no items"
    price_id = items[0]["price"]["id"]
    plan = plan_for_price(price_id)
    if plan is None:
        return f"skipped: unknown price {price_id}"

    user = (
        await db.execute(
            select(User).where(User.stripe_subscription_id == subscription_id)
        )
    ).scalar_one_or_none()
    if user is None:
        return f"skipped: no user with sub {subscription_id}"

    if sub.get("status") in {"canceled", "unpaid", "incomplete_expired"}:
        user.plan = "trial_expired"
    else:
        user.plan = plan
    await db.commit()
    return f"synced user {user.id} → plan={user.plan} status={sub.get('status')}"


async def _handle_subscription_deleted(event_data: dict, db: AsyncSession) -> str:
    sub = event_data["object"]
    user = (
        await db.execute(
            select(User).where(User.stripe_subscription_id == sub["id"])
        )
    ).scalar_one_or_none()
    if user is None:
        return "skipped: user not found"
    user.plan = "trial_expired"
    await db.commit()
    return f"downgraded user {user.id} to trial_expired"


async def _handle_payment_failed(event_data: dict, db: AsyncSession) -> str:
    invoice = event_data["object"]
    customer_id = invoice.get("customer")
    user = (
        await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
    ).scalar_one_or_none()
    if user is None:
        return "skipped: no user for customer"
    # Day 10: send email via Resend. For now, log only.
    log.warning(
        "Payment failed for user %s (customer %s, invoice %s)",
        user.id, customer_id, invoice.get("id"),
    )
    return f"logged payment_failed for user {user.id}"


_HANDLERS: dict[str, callable] = {
    "checkout.session.completed": _handle_checkout_completed,
    "customer.subscription.updated": _handle_subscription_updated,
    "customer.subscription.deleted": _handle_subscription_deleted,
    "invoice.payment_failed": _handle_payment_failed,
}


@router.post("/webhook", response_model=WebhookAckResponse)
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    raw_body = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = stripe_client.verify_webhook_signature(raw_body, sig_header)
    except stripe_client.BillingError as exc:
        log.warning("Webhook rejected: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    event_type = event.get("type", "")
    handler = _HANDLERS.get(event_type)
    if handler is None:
        # Many event types we don't care about — ack 200 so Stripe doesn't retry
        return WebhookAckResponse(received=True, event_type=event_type, action="ignored")

    try:
        action = await handler(event["data"], db)
    except Exception as exc:  # don't 500 — Stripe would retry endlessly
        log.exception("Webhook handler crashed for %s: %s", event_type, exc)
        return WebhookAckResponse(received=True, event_type=event_type, action=f"error: {exc}")

    return WebhookAckResponse(received=True, event_type=event_type, action=action)


# Tiny utility for the dashboard: tells the UI whether billing is wired
@router.get("/status")
async def billing_status():
    s = get_settings()
    return {
        "configured": stripe_client.is_configured(),
        "webhook_secret_set": bool(s.stripe_webhook_secret),
        "prices_configured": all([
            s.stripe_price_individual_monthly,
            s.stripe_price_individual_yearly,
            s.stripe_price_agency_monthly,
            s.stripe_price_agency_yearly,
        ]),
        "checked_at": datetime.now(UTC).isoformat(),
    }


# Type checking placeholder — the dict typing above is fine at runtime
_ = Response
