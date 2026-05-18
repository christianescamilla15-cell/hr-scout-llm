# Load testing — Locust

Simulates concurrent recruiter traffic against the HRScout backend
to find latency cliffs, quota-enforcement bottlenecks, and DB-pool
saturation before a real customer experiences them.

## Quick start (against local docker stack)

```bash
# Bring up backend + db + frontend + locust
docker compose --env-file .env.docker --profile loadtest up

# Open the Locust web UI
open http://localhost:8089
```

In the UI:
- **Number of users**: start with 50
- **Spawn rate**: 5/sec
- **Host**: prefilled to `http://backend:8000`
- Click **Start swarming**

Watch the live RPS + latency chart. Stop when you see what you need.

## Quick start (against staging cloud)

```bash
docker run -p 8089:8089 \
  -v $(pwd)/loadtest:/mnt/locust \
  locustio/locust \
  -f /mnt/locust/locustfile.py \
  --host https://hrscout-api-staging.onrender.com
```

## Auth-protected endpoints

By default the test script only hits public endpoints (`/api/health`,
`/api/billing/status`, `/api/auth/me`-as-401). That's enough to find:

- Health endpoint p95 latency under load
- DB connection pool saturation (health probe pings DB)
- CORS preflight cost

To also exercise `/api/jobs`, `/api/candidates`, `/api/analyses/*`,
provide a real session JWT:

```bash
# Generate from a Python REPL against the same JWT_SECRET the server uses
python -c "
from app.auth.jwt_tokens import mint_session_token
from uuid import UUID
# user_id of the seeded ana.ruiz@hrscout.demo (run seed_demo.py first)
print(mint_session_token(UUID('<their uuid>'), 'ana.ruiz@hrscout.demo', 'trial'))
"

# Pass it to locust
docker run -e HRSCOUT_TEST_TOKEN=eyJhbGc... ...
```

**Never use a real user's session token from production.** Always
generate a fresh one from the staging JWT_SECRET pointing at a
seed/demo user.

## What the AuthenticatedRecruiter scenario does NOT do

It does NOT:

- Run real Google OAuth (impossible to script Google consent)
- Run `POST /api/analyses` (would burn Groq tokens; toggle in by
  uncommenting the task if you specifically want to test that path —
  costs ~$0.01-0.05 USD per 1000 calls at Groq free tier)
- Upload PDFs (multipart load testing is its own beast; do it
  separately if needed)
- Trigger Stripe checkout (would create fake test customers)

These are by design: load testing the read paths under realistic
traffic catches 80% of capacity issues without burning $$ on third-
party APIs.

## Reading the results

What to look for on a Starter Render plan (1 CPU, 512 MB):

| Metric | Healthy | Warning | Danger |
|---|---|---|---|
| `/api/health` p95 latency | < 200 ms | 200-500 ms | > 500 ms |
| `/api/jobs` p95 latency | < 800 ms | 800-2000 ms | > 2000 ms |
| Failure % | 0 | < 1% | > 1% |
| RPS sustained | depends | — | — |

If `/api/health` is slow but other endpoints are fine, the DB pool is
saturating. Upgrade Postgres plan or add connection pooling middleware.

If everything is slow, the Render Starter is CPU-bound — scale to
Standard ($25/mo) or beyond.

If failures are non-zero on `/api/jobs` but not on `/api/health`, the
Postgres connection limit is being hit. Render Starter Postgres is
~22 connections.
