"""One-shot script to provision HRScout's Stripe products + prices.

Reads STRIPE_SECRET_KEY from the environment (or backend/.env via dotenv),
creates the 2 products (Individual + Agency) with their 4 prices
(monthly + yearly each), and prints the IDs so you can paste them into
.env.

Idempotent: if a product/price with the same lookup_key already exists,
it's reused instead of duplicated. Safe to run multiple times.

## Usage

    cd backend
    # Make sure STRIPE_SECRET_KEY=sk_test_... is in your .env
    .venv/Scripts/python.exe scripts/setup_stripe.py

    # Or override for prod:
    STRIPE_SECRET_KEY=sk_live_... .venv/Scripts/python.exe scripts/setup_stripe.py

## Output

    STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_xxxxx
    STRIPE_PRICE_INDIVIDUAL_YEARLY=price_xxxxx
    STRIPE_PRICE_AGENCY_MONTHLY=price_xxxxx
    STRIPE_PRICE_AGENCY_YEARLY=price_xxxxx

Copy those lines into backend/.env (and later into Render env vars).

## Pricing config

All amounts USD per spec §2. To change pricing, edit PRODUCTS below and
re-run; Stripe Prices are immutable, so a price change creates a new
price_id (the old one stays for existing subscribers).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

# Load .env from backend/ even when the script is run from a different cwd
_env_path = Path(__file__).resolve().parent.parent / ".env"
if load_dotenv and _env_path.exists():
    load_dotenv(_env_path)

try:
    import stripe
except ImportError:
    sys.exit("stripe SDK missing — run: pip install -r requirements.txt")


PRODUCTS: list[dict] = [
    {
        "lookup_prefix": "hrscout_individual",
        "name": "HRScout Individual",
        "description": (
            "Para reclutadoras freelance. 100 análisis al mes, "
            "5 vacantes guardadas, soporte por WhatsApp."
        ),
        "metadata": {"plan": "individual", "seats": "1"},
        "prices": [
            {
                "interval": "month",
                "amount_usd": 97,
                "lookup_key": "hrscout_individual_monthly",
                "nickname": "Individual — Mensual",
            },
            {
                "interval": "year",
                "amount_usd": 970,
                "lookup_key": "hrscout_individual_yearly",
                "nickname": "Individual — Anual (2 meses gratis)",
            },
        ],
    },
    {
        "lookup_prefix": "hrscout_agency",
        "name": "HRScout Agency",
        "description": (
            "Para equipos de 2 a 10 personas. 500 análisis al mes, "
            "vacantes ilimitadas, hasta 3 usuarios, reportes PDF con tu marca."
        ),
        "metadata": {"plan": "agency", "seats": "3"},
        "prices": [
            {
                "interval": "month",
                "amount_usd": 297,
                "lookup_key": "hrscout_agency_monthly",
                "nickname": "Agency — Mensual",
            },
            {
                "interval": "year",
                "amount_usd": 2970,
                "lookup_key": "hrscout_agency_yearly",
                "nickname": "Agency — Anual (2 meses gratis)",
            },
        ],
    },
]


def _find_product_by_metadata(plan: str) -> stripe.Product | None:
    """Stripe doesn't filter products by metadata server-side; we scan recent."""
    for product in stripe.Product.list(active=True, limit=100).auto_paging_iter():
        if product.metadata.get("plan") == plan:
            return product
    return None


def _find_price_by_lookup(lookup_key: str) -> stripe.Price | None:
    matches = stripe.Price.list(lookup_keys=[lookup_key], limit=1)
    return matches.data[0] if matches.data else None


def upsert_product(spec: dict) -> stripe.Product:
    existing = _find_product_by_metadata(spec["metadata"]["plan"])
    if existing:
        print(f"  reuse product: {existing.id} ({existing.name})")
        return existing
    created = stripe.Product.create(
        name=spec["name"],
        description=spec["description"],
        metadata=spec["metadata"],
    )
    print(f"  CREATED product: {created.id} ({created.name})")
    return created


def upsert_price(product_id: str, spec: dict) -> stripe.Price:
    existing = _find_price_by_lookup(spec["lookup_key"])
    if existing and existing.product == product_id:
        print(f"  reuse price ({spec['interval']}): {existing.id}")
        return existing
    created = stripe.Price.create(
        product=product_id,
        unit_amount=spec["amount_usd"] * 100,  # cents
        currency="usd",
        recurring={"interval": spec["interval"]},
        lookup_key=spec["lookup_key"],
        nickname=spec["nickname"],
        transfer_lookup_key=True,  # if there was an old price with the same key, move it
    )
    print(f"  CREATED price ({spec['interval']}): {created.id} @ ${spec['amount_usd']} USD")
    return created


def main() -> int:
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        sys.exit("STRIPE_SECRET_KEY missing. Put it in backend/.env or pass via env.")
    if not (key.startswith("sk_test_") or key.startswith("sk_live_")):
        sys.exit(f"STRIPE_SECRET_KEY shape looks wrong: {key[:10]}... — expected sk_test_ or sk_live_")

    stripe.api_key = key
    mode = "TEST" if key.startswith("sk_test_") else "LIVE"
    print(f"\n=== Stripe setup in {mode} mode ===\n")

    env_lines: list[str] = []
    for product_spec in PRODUCTS:
        print(f"[{product_spec['name']}]")
        product = upsert_product(product_spec)
        for price_spec in product_spec["prices"]:
            price = upsert_price(product.id, price_spec)
            # Map lookup_key → env var name
            env_var = price_spec["lookup_key"].upper()  # hrscout_individual_monthly → HRSCOUT_INDIVIDUAL_MONTHLY
            # Strip "HRSCOUT_" prefix to match the env var naming in .env.example
            env_name = "STRIPE_PRICE_" + env_var.removeprefix("HRSCOUT_")
            env_lines.append(f"{env_name}={price.id}")
        print()

    print("=== Paste into backend/.env ===")
    for line in env_lines:
        print(line)
    print()
    print(f"Mode: {mode}. Re-run with sk_live_... when you're ready for prod.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
