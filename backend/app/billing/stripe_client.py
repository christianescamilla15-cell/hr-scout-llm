"""Stripe SDK wrapper. Lazy-init so the app boots even when STRIPE_SECRET_KEY
is missing (the billing endpoints will return 503 in that case).

All methods are sync because the Stripe SDK is sync — we wrap calls in
FastAPI's threadpool by simply not awaiting them (FastAPI does the right
thing for sync functions in async endpoints). The two we DO want async
(payment confirmation polling, etc.) aren't needed for MVP.
"""

import logging
from typing import Any

import stripe

from app.config import get_settings

log = logging.getLogger(__name__)


class BillingNotConfigured(Exception):
    """Raised when STRIPE_SECRET_KEY is missing — caller returns 503."""


class BillingError(Exception):
    """Raised on any Stripe API or signature failure."""


def _ensure_configured() -> str:
    s = get_settings()
    if not s.stripe_secret_key:
        raise BillingNotConfigured(
            "STRIPE_SECRET_KEY is not set. Run scripts/setup_stripe.py first."
        )
    stripe.api_key = s.stripe_secret_key
    return s.stripe_secret_key


def is_configured() -> bool:
    return bool(get_settings().stripe_secret_key)


def get_or_create_customer(email: str, name: str, existing_id: str | None = None) -> str:
    """Return a stripe_customer_id, either an existing one or a fresh one."""
    _ensure_configured()
    if existing_id:
        try:
            customer = stripe.Customer.retrieve(existing_id)
            if not customer.get("deleted"):
                return existing_id
        except stripe.error.InvalidRequestError:
            pass  # stale ID, fall through and create a new one
    customer = stripe.Customer.create(email=email, name=name)
    return customer.id


def create_checkout_session(
    *,
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    user_id: str,
) -> dict[str, Any]:
    """Create a Stripe Checkout session for a subscription. Returns dict with
    'id' + 'url' for the client to redirect to."""
    _ensure_configured()
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=user_id,
            subscription_data={"metadata": {"hrscout_user_id": user_id}},
            allow_promotion_codes=True,
        )
    except stripe.error.StripeError as exc:
        raise BillingError(f"Stripe checkout creation failed: {exc}") from exc
    return {"id": session.id, "url": session.url}


def create_portal_session(*, customer_id: str, return_url: str) -> dict[str, Any]:
    """Customer Portal — where users cancel, update payment method, etc."""
    _ensure_configured()
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
    except stripe.error.StripeError as exc:
        raise BillingError(f"Stripe portal creation failed: {exc}") from exc
    return {"url": session.url}


def verify_webhook_signature(payload: bytes, sig_header: str) -> dict[str, Any]:
    """Verify the Stripe-Signature header and return the parsed event.
    Raises BillingError on bad signature or missing secret."""
    s = get_settings()
    if not s.stripe_webhook_secret:
        raise BillingError("STRIPE_WEBHOOK_SECRET not set — refusing unverified webhook")
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=s.stripe_webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise BillingError(f"Webhook signature invalid: {exc}") from exc
    return event


def fetch_subscription(subscription_id: str) -> dict[str, Any]:
    """Pull a fresh copy of a subscription from Stripe (used by webhook handlers
    that get only IDs from the event payload)."""
    _ensure_configured()
    try:
        return stripe.Subscription.retrieve(subscription_id)
    except stripe.error.StripeError as exc:
        raise BillingError(f"Subscription fetch failed: {exc}") from exc
