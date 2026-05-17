# HRScout Backend — Day 1 scaffold

FastAPI + SQLAlchemy 2 async + Alembic + Postgres (prod) / SQLite (dev).

Full product spec: [`../docs/COMMERCIAL_LAUNCH_SPEC.md`](../docs/COMMERCIAL_LAUNCH_SPEC.md).

## Quick start (dev)

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate     # Windows · use source .venv/bin/activate on Unix
pip install -r requirements-dev.txt

cp .env.example .env       # edit DATABASE_URL etc. — defaults are SQLite local

alembic upgrade head       # apply schema
pytest -q                  # run test suite

uvicorn app.main:app --port 8004 --reload
# → http://localhost:8004/api/health
# → http://localhost:8004/docs (OpenAPI UI)
```

## Layout

```
backend/
├── app/
│   ├── __init__.py            # __version__
│   ├── config.py              # Pydantic Settings + URL normalization
│   ├── main.py                # FastAPI app + lifespan + CORS
│   ├── db/
│   │   ├── database.py        # async engine + SessionLocal + get_db
│   │   └── models.py          # users, orgs, jobs, candidates, analyses, usage_events + GUID type
│   └── routers/
│       └── health.py          # /api/health (DB ping)
├── alembic/
│   ├── env.py                 # async-aware
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py
├── alembic.ini
├── tests/
│   ├── conftest.py            # in-memory SQLite fixture + httpx ASGI client
│   ├── test_health.py
│   ├── test_models.py
│   └── test_config.py
├── pyproject.toml             # pytest + ruff config
├── requirements.txt           # runtime
├── requirements-dev.txt       # runtime + pytest + ruff
├── Dockerfile                 # python:3.12-slim, alembic upgrade head + uvicorn
└── .env.example
```

## Schema (created by migration 0001)

7 tables per spec §4:

- `users` — auth + plan + Stripe linkage + trial timer
- `organizations` — Agency-plan org container
- `organization_members` — many-to-many users↔orgs with role
- `jobs` — saved job descriptions
- `candidates` — CV text (PII columns Fernet-encrypted at app layer, not in DB)
- `analyses` — one per job × candidate run, with cost + latency tracking
- `usage_events` — per-event log for monthly quota enforcement

UUID handling: a portable `GUID` TypeDecorator uses native `UUID` on Postgres
and `CHAR(36)` on SQLite. Same Python type either way.

## Database URL normalization

Render uses `postgres://...` which is deprecated. `config.normalized_database_url`
rewrites to `postgresql+asyncpg://...` so neither dev nor prod needs to care.

## Day 1 status

- FastAPI app boots with /api/health responding 200 + DB ping ok
- Alembic migration 0001 creates all 7 tables
- Tests cover health (4), models end-to-end (4), URL normalization (5) = 13 baseline
- Dockerfile ready for Render Web Service deploy
- `.env.example` documents every env var the spec will need across Days 2-10

## Next (Day 2)

- `/api/auth/google/start` + `/api/auth/google/callback`
- JWT minting + httpOnly cookie session
- `/api/auth/me`
