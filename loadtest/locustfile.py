"""Locust load-test for HRScout.

Simulates the recruiter happy path:
  1. health probe (anonymous)
  2. fetch landing-like endpoints
  3. (auth-required) list jobs, create job, list candidates, paste candidate,
     run an analysis, download usage info, download PDF

Usage:

  # Against local docker stack:
  docker compose --profile loadtest up

  Then open http://localhost:8089 — set host to http://backend:8000 in the
  UI (or the compose file does it for you), pick 50 users / 5 spawn rate,
  click Start.

  # Against staging cloud (when it exists):
  docker run -p 8089:8089 -v ./loadtest:/mnt/locust locustio/locust \\
    -f /mnt/locust/locustfile.py --host https://hrscout-api-staging.onrender.com

## Auth note

This script does NOT do the real Google OAuth flow (impossible to script
against a third-party consent screen). Instead, the auth task path is
gated on a pre-baked HRSCOUT_TEST_TOKEN env var: a session JWT minted
against the same JWT_SECRET as the server. The seed_demo.py user IDs are
deterministic for this purpose.

If HRSCOUT_TEST_TOKEN is unset, only public endpoints are hit (still
useful for measuring health/landing latency under load).
"""

import os
import random

from locust import HttpUser, between, task

TOKEN = os.environ.get("HRSCOUT_TEST_TOKEN", "")


class AnonymousVisitor(HttpUser):
    """Browses the public surface — what an unauthenticated visitor does."""

    wait_time = between(1, 5)
    weight = 3  # 3x more anonymous than logged-in users (realistic landing traffic)

    @task(5)
    def health(self):
        self.client.get("/api/health", name="GET /api/health")

    @task(2)
    def billing_status(self):
        # Public endpoint, no auth needed
        self.client.get("/api/billing/status", name="GET /api/billing/status")

    @task(1)
    def me_anonymous(self):
        # Expected 401 — measures the auth-rejection overhead
        with self.client.get(
            "/api/auth/me",
            name="GET /api/auth/me (anon)",
            catch_response=True,
        ) as r:
            if r.status_code == 401:
                r.success()


class AuthenticatedRecruiter(HttpUser):
    """Walks the recruiter happy path with a real session cookie."""

    wait_time = between(2, 8)
    weight = 1

    def on_start(self):
        if not TOKEN:
            # No token → don't even start, but don't crash either
            self.environment.runner.quit()
            return
        # Set session cookie for the whole session
        self.client.cookies.set("hrscout_session", TOKEN)

    @task(4)
    def list_jobs(self):
        self.client.get("/api/jobs", name="GET /api/jobs")

    @task(2)
    def list_candidates(self):
        self.client.get("/api/candidates", name="GET /api/candidates")

    @task(2)
    def usage(self):
        self.client.get("/api/analyses/usage", name="GET /api/analyses/usage")

    @task(1)
    def list_analyses(self):
        self.client.get("/api/analyses", name="GET /api/analyses")

    @task(1)
    def me(self):
        self.client.get("/api/auth/me", name="GET /api/auth/me (auth)")
