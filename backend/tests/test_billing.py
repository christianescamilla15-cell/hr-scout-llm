"""Billing endpoint tests — all hermetic (stripe_client patched, no real API calls).

The webhook handlers are exercised by feeding pre-built event dicts directly
to the dispatcher path, skipping signature verification (covered separately)."""

import json
from datetime import UTC, datetime, timedelta

import pytest

from app.auth.jwt_tokens import mint_session_token
from app.db.models import User


async def _seed_user(db_session, plan: str = "trial", customer_id: str | None = None,
                     subscription_id: str | None = None) -> tuple[User, str]:
    user = User(
        email="rec@example.mx",
        name="Recruiter",
        plan=plan,
        trial_ends_at=datetime.now(UTC) + timedelta(days=14),
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user, mint_session_token(user.id, user.email, user.plan)


# ──────────────────────────────────────────────────────────── /checkout


@pytest.mark.asyncio
async def test_checkout_requires_auth(client):
    response = await client.post("/api/billing/checkout", json={"plan": "individual"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_checkout_503_when_stripe_not_configured(client, db_session, monkeypatch):
    monkeypatch.setattr("app.billing.stripe_client.is_configured", lambda: False)
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: False)
    _, token = await _seed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/billing/checkout", json={"plan": "individual"})
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


@pytest.mark.asyncio
async def test_checkout_503_when_price_not_configured(client, db_session, monkeypatch):
    """Stripe configured but the specific price env var is missing."""
    monkeypatch.setattr("app.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr(
        "app.routers.billing.lookup_key_for_plan_interval",
        lambda plan, interval: None,
    )
    _, token = await _seed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/billing/checkout", json={"plan": "individual", "interval": "monthly"}
    )
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_checkout_happy_path(client, db_session, monkeypatch):
    monkeypatch.setattr("app.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr(
        "app.routers.billing.lookup_key_for_plan_interval",
        lambda plan, interval: "price_test_individual_monthly",
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.get_or_create_customer",
        lambda email, name, existing_id=None: "cus_test_123",
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.create_checkout_session",
        lambda **kwargs: {
            "id": "cs_test_abc",
            "url": "https://checkout.stripe.com/c/pay/cs_test_abc",
        },
    )

    _, token = await _seed_user(db_session)
    client.cookies.set("hrscout_session", token)

    response = await client.post(
        "/api/billing/checkout", json={"plan": "individual", "interval": "monthly"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] == "cs_test_abc"
    assert body["url"].startswith("https://checkout.stripe.com/")


# ──────────────────────────────────────────────────────────── /portal


@pytest.mark.asyncio
async def test_portal_400_without_existing_customer(client, db_session, monkeypatch):
    monkeypatch.setattr("app.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: True)
    _, token = await _seed_user(db_session)  # no customer_id
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/billing/portal")
    assert response.status_code == 400
    assert "No Stripe customer" in response.json()["detail"]


@pytest.mark.asyncio
async def test_portal_happy_path(client, db_session, monkeypatch):
    monkeypatch.setattr("app.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: True)
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.create_portal_session",
        lambda **kwargs: {"url": "https://billing.stripe.com/p/session/test_123"},
    )

    _, token = await _seed_user(db_session, customer_id="cus_test_123")
    client.cookies.set("hrscout_session", token)

    response = await client.post("/api/billing/portal")
    assert response.status_code == 200
    assert response.json()["url"].startswith("https://billing.stripe.com/")


# ──────────────────────────────────────────────────────────── /webhook


def _checkout_completed_event(user_id: str, subscription_id: str, customer_id: str):
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": user_id,
                "subscription": subscription_id,
                "customer": customer_id,
            }
        },
    }


def _subscription_updated_event(subscription_id: str, price_id: str, sub_status: str = "active"):
    return {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": subscription_id,
                "status": sub_status,
                "items": {"data": [{"price": {"id": price_id}}]},
            }
        },
    }


def _subscription_deleted_event(subscription_id: str):
    return {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": subscription_id, "items": {"data": []}}},
    }


@pytest.mark.asyncio
async def test_webhook_400_on_missing_signature_header(client):
    response = await client.post("/api/billing/webhook", content=b"{}")
    assert response.status_code == 400
    assert "Missing Stripe-Signature" in response.json()["detail"]


@pytest.mark.asyncio
async def test_webhook_400_on_bad_signature(client, monkeypatch):
    def fake_verify(payload, sig):
        from app.billing.stripe_client import BillingError
        raise BillingError("Webhook signature invalid: garbage")

    monkeypatch.setattr("app.routers.billing.stripe_client.verify_webhook_signature", fake_verify)

    response = await client.post(
        "/api/billing/webhook",
        content=b"{}",
        headers={"stripe-signature": "t=123,v1=bad"},
    )
    assert response.status_code == 400
    assert "signature invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_webhook_unknown_event_type_acked(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.verify_webhook_signature",
        lambda payload, sig: {"type": "some.unrelated.event", "data": {"object": {}}},
    )
    response = await client.post(
        "/api/billing/webhook",
        content=b"{}",
        headers={"stripe-signature": "t=0,v1=fake"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["received"] is True
    assert body["action"] == "ignored"


@pytest.mark.asyncio
async def test_webhook_checkout_completed_upgrades_user(client, db_session, monkeypatch):
    user, _ = await _seed_user(db_session)

    event = _checkout_completed_event(
        user_id=str(user.id),
        subscription_id="sub_test_xyz",
        customer_id="cus_test_xyz",
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.verify_webhook_signature",
        lambda payload, sig: event,
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.fetch_subscription",
        lambda sid: {
            "items": {"data": [{"price": {"id": "price_test_individual_monthly"}}]},
        },
    )
    monkeypatch.setattr(
        "app.routers.billing.plan_for_price",
        lambda price_id: "individual",
    )

    response = await client.post(
        "/api/billing/webhook",
        content=json.dumps(event).encode(),
        headers={"stripe-signature": "t=0,v1=fake"},
    )
    assert response.status_code == 200
    assert "upgraded" in response.json()["action"]

    await db_session.refresh(user)
    assert user.plan == "individual"
    assert user.stripe_subscription_id == "sub_test_xyz"
    assert user.stripe_customer_id == "cus_test_xyz"
    assert user.trial_ends_at is None


@pytest.mark.asyncio
async def test_webhook_subscription_deleted_downgrades_user(client, db_session, monkeypatch):
    user, _ = await _seed_user(
        db_session, plan="individual",
        customer_id="cus_test_123", subscription_id="sub_test_kill",
    )

    event = _subscription_deleted_event("sub_test_kill")
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.verify_webhook_signature",
        lambda payload, sig: event,
    )

    response = await client.post(
        "/api/billing/webhook",
        content=json.dumps(event).encode(),
        headers={"stripe-signature": "t=0,v1=fake"},
    )
    assert response.status_code == 200
    await db_session.refresh(user)
    assert user.plan == "trial_expired"


@pytest.mark.asyncio
async def test_webhook_subscription_updated_syncs_plan(client, db_session, monkeypatch):
    user, _ = await _seed_user(
        db_session, plan="individual",
        customer_id="cus_x", subscription_id="sub_upgrade",
    )

    event = _subscription_updated_event(
        "sub_upgrade", price_id="price_test_agency_monthly", sub_status="active",
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.verify_webhook_signature",
        lambda payload, sig: event,
    )
    monkeypatch.setattr(
        "app.routers.billing.plan_for_price",
        lambda price_id: "agency",
    )

    response = await client.post(
        "/api/billing/webhook",
        content=json.dumps(event).encode(),
        headers={"stripe-signature": "t=0,v1=fake"},
    )
    assert response.status_code == 200
    await db_session.refresh(user)
    assert user.plan == "agency"


@pytest.mark.asyncio
async def test_webhook_subscription_canceled_status_downgrades(client, db_session, monkeypatch):
    user, _ = await _seed_user(
        db_session, plan="individual",
        customer_id="cus_y", subscription_id="sub_cancel",
    )

    event = _subscription_updated_event(
        "sub_cancel", price_id="price_test_individual_monthly", sub_status="canceled",
    )
    monkeypatch.setattr(
        "app.routers.billing.stripe_client.verify_webhook_signature",
        lambda payload, sig: event,
    )
    monkeypatch.setattr(
        "app.routers.billing.plan_for_price",
        lambda price_id: "individual",
    )

    response = await client.post(
        "/api/billing/webhook",
        content=json.dumps(event).encode(),
        headers={"stripe-signature": "t=0,v1=fake"},
    )
    assert response.status_code == 200
    await db_session.refresh(user)
    assert user.plan == "trial_expired"


# ──────────────────────────────────────────────────────────── /status


@pytest.mark.asyncio
async def test_status_reports_unconfigured(client, monkeypatch):
    monkeypatch.setattr("app.routers.billing.stripe_client.is_configured", lambda: False)

    class FakeSettings:
        stripe_webhook_secret = None
        stripe_price_individual_monthly = None
        stripe_price_individual_yearly = None
        stripe_price_agency_monthly = None
        stripe_price_agency_yearly = None

    monkeypatch.setattr("app.routers.billing.get_settings", lambda: FakeSettings())

    response = await client.get("/api/billing/status")
    assert response.status_code == 200
    body = response.json()
    assert body["configured"] is False
    assert body["webhook_secret_set"] is False
    assert body["prices_configured"] is False
