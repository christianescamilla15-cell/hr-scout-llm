# HRScout local staging — Docker

End-to-end stack of the entire HRScout product running in containers
on your dev machine. Replaces the "venv + npm dev in two terminals"
flow with a single `docker compose up`. Useful for:

- Demoing the full product without touching prod Render
- Reproducing prod bugs locally with the same Postgres version (16)
- Load testing without burning Render bandwidth
- Code quality scanning with SonarQube before opening a PR

> Production deploy is unchanged: backend → Render, frontend → Vercel.
> See `LAUNCH_CHECKLIST.md` for prod ops.

---

## Prerequisites

- Docker Desktop 4.x or compatible
- ~3 GB free RAM (Postgres + Sonar are hungry when both run)
- Ports `3004`, `8004`, `5433` free (`9000`, `8089` if you use SonarQube/Locust)

## First run

```bash
# 1. Copy env example
cp docker.env.example docker.env

# 2. Fill in REAL Google + Groq keys in docker.env
#    (otherwise login + analyses will be degraded)

# 3. Bring up the core stack: backend, postgres, frontend
docker compose --env-file docker.env up backend postgres frontend
```

Visit:
- **Frontend**: http://localhost:3004 (Vite dev with HMR)
- **Backend**:  http://localhost:8004 (FastAPI, auto-reload on save)
- **API docs**: http://localhost:8004/docs (Swagger UI)
- **Postgres**: `psql -h localhost -p 5433 -U hrscout -d hrscout`

Stop with `Ctrl+C`. State persists in the named volume `hrscout_pg_data`.

## Seeding demo data

The seed script is a one-shot Compose service. Run it ONCE after the
first migration:

```bash
docker compose --env-file docker.env --profile seed up seed
```

It creates:

- **5 demo users** (1 trial, 2 individual, 1 agency owner, 1 agency member)
- **1 organization** (Talent MX)
- **30 jobs MX-realistic** (Backend Python, Frontend React, Contador,
  KAM, DevOps, etc.)
- **150 candidates** with deterministic Faker-style names + plausible
  CVs in Spanish MX
- **80 analyses** pre-computed via the local scorer (so the dashboard
  is populated when you log in)

It's idempotent: re-running does nothing if `ana.ruiz@hrscout.demo`
already exists. To re-seed from scratch:

```bash
docker compose down -v        # WARNING: deletes ALL local data
docker compose --env-file docker.env up -d backend postgres
docker compose --env-file docker.env --profile seed up seed
```

## Load testing — Locust

Simulates 50+ concurrent recruiters hitting the backend:

```bash
docker compose --env-file docker.env --profile loadtest up locust
```

Open **http://localhost:8089** → set users + spawn rate → click Start.

Details + reading the results: `loadtest/README.md`.

## Code quality — SonarQube (community)

SonarQube runs alongside your stack with its OWN Postgres (the app's
DB is untouched). First-time setup needs ~2 min for Sonar to boot.

```bash
# 1. Start SonarQube
docker compose --profile sonar up sonarqube sonar-db

# 2. Open http://localhost:9000
#    Default login: admin / admin → it'll force you to change.
#    Then: My Account → Security → Generate Token → save the value.

# 3. Put the token in docker.env:
#    SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxx

# 4. Run the scanner (one-shot)
docker compose --env-file docker.env --profile sonar-scan up sonar-scanner

# 5. Refresh http://localhost:9000/dashboard?id=hrscout to see results
```

`sonar-project.properties` at the repo root controls what gets scanned.

### Why community edition

The free tier (Community) covers:
- Bugs / code smells / vulnerabilities on Python + JavaScript
- Cyclomatic complexity, duplication, basic coverage
- Quality gate enforcement

Missing vs Developer Edition ($150/mo): branch analysis, PR
decoration on GitHub, security hotspot deep scans. We don't need
those until we have a real engineering team.

## Connecting to prod-style services

If you want to test against a REAL Anthropic key or Groq key for an
actual analysis run, put them in `docker.env` — the backend container
picks them up. Don't put prod Stripe keys in this file; the backend
runs in degraded mode without Stripe, and live Stripe in a dev compose
would create real customers.

## Cleanup

```bash
# Stop everything, keep data
docker compose down

# Stop and delete the Postgres volume (loses seed data)
docker compose down -v

# Also nuke SonarQube volumes
docker compose --profile sonar down -v
```

## Common issues

| Symptom | Fix |
|---|---|
| `port 8004 already in use` | Either kill the local uvicorn, or set `BACKEND_PORT=8005` in `docker.env` |
| `port 5433 already in use` | Override `POSTGRES_PORT=5434` |
| Backend healthcheck fails | Check `docker compose logs backend` — usually Alembic migration error |
| `relation "users" does not exist` | Alembic didn't run. The backend's `command:` runs `alembic upgrade head` first; if you bypass it, run manually: `docker compose exec backend alembic upgrade head` |
| SonarQube container exits with `vm.max_map_count` error | Linux only — run `sudo sysctl -w vm.max_map_count=262144` on the host |
| Vite frontend "Cannot find module" after deps change | `docker compose build --no-cache frontend` |

## Branch staging cloud (Phase B — not yet provisioned)

When/if Christian approves Phase B, this same stack mirrors to:

- `hrscout-api-staging.onrender.com`  ($7/mo Render Web Service)
- `hrscout-db-staging` ($6/mo Render Postgres)
- `hr-scout-llm-staging.vercel.app` (free Vercel preview)

Auto-deploy on `git push origin staging`. The `.github/workflows/`
file that wires this lives at `.github/workflows/staging-deploy.yml`
(to be added in Phase B).
