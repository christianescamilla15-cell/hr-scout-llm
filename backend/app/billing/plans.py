"""Price ID → plan mapping. Source of truth for which Stripe price
corresponds to which internal plan.

The mapping is derived from env vars set by scripts/setup_stripe.py.
If a webhook arrives with a price we don't recognize, we log a warning
and don't change the user's plan (safer than guessing).
"""

import logging
from typing import Literal

from app.config import get_settings

log = logging.getLogger(__name__)

PlanName = Literal["trial", "individual", "agency", "trial_expired"]


def price_to_plan() -> dict[str, PlanName]:
    """Build the mapping from env vars. Computed per-call so config changes
    take effect without process restart (matches the rest of the codebase)."""
    s = get_settings()
    mapping: dict[str, PlanName] = {}
    if s.stripe_price_individual_monthly:
        mapping[s.stripe_price_individual_monthly] = "individual"
    if s.stripe_price_individual_yearly:
        mapping[s.stripe_price_individual_yearly] = "individual"
    if s.stripe_price_agency_monthly:
        mapping[s.stripe_price_agency_monthly] = "agency"
    if s.stripe_price_agency_yearly:
        mapping[s.stripe_price_agency_yearly] = "agency"
    return mapping


def plan_for_price(price_id: str) -> PlanName | None:
    """Returns the internal plan for a given Stripe price ID, or None
    if it's unknown (warning logged so we notice missing config)."""
    plan = price_to_plan().get(price_id)
    if plan is None:
        log.warning(
            "Webhook referenced unknown price %s — STRIPE_PRICE_* env vars may be misconfigured",
            price_id,
        )
    return plan


def lookup_key_for_plan_interval(plan: str, interval: str) -> str | None:
    """Convert (plan, interval) → price_id for checkout requests from the client.
    Returns None if not configured."""
    s = get_settings()
    if plan == "individual" and interval == "monthly":
        return s.stripe_price_individual_monthly
    if plan == "individual" and interval == "yearly":
        return s.stripe_price_individual_yearly
    if plan == "agency" and interval == "monthly":
        return s.stripe_price_agency_monthly
    if plan == "agency" and interval == "yearly":
        return s.stripe_price_agency_yearly
    return None
