# HRScout Launch Checklist — Día 10

Manual verification + ops setup needed before flipping the SaaS live for
real reclutadoras MX. Run this in order; everything above the **GO**
marker must be green.

> Spec source of truth: [`COMMERCIAL_LAUNCH_SPEC.md`](./COMMERCIAL_LAUNCH_SPEC.md).
> Definition of done lives in §17.

---

## 1 · Pre-flight (local dev box)

- [ ] `cd backend && .venv/Scripts/python.exe -m pytest -q` → all green (~145 tests)
- [ ] `npm test` (from project root) → all green (~145 tests)
- [ ] `npm run build` → bundle under 500 KB (currently ~480 KB / ~147 KB gzip)
- [ ] `backend/.env` has REAL values for:
  - [ ] `JWT_SECRET` (32 bytes random — `python -c "import secrets; print(secrets.token_hex(32))"`)
  - [ ] `FERNET_KEY` (`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)
  - [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (project `nexus-forge-ia`)
  - [ ] `GROQ_API_KEY` (rotated post-session — old one leaked in chat transcript)
  - [ ] `STRIPE_SECRET_KEY=sk_test_...` (then sk_live_... for prod cutover)
  - [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (from `stripe listen` or dashboard)
  - [ ] 4 `STRIPE_PRICE_*` IDs (output of `scripts/setup_stripe.py`)
  - [ ] `RESEND_API_KEY=re_...` (with hrscout.mx domain verified — see §3 below)

---

## 2 · Manual smoke (the golden path)

Run backend `uvicorn app.main:app --port 8004 --reload` + frontend
`npm run dev` simultaneously, then walk through this clicking like a
real user:

- [ ] Visit `http://localhost:3004/` → landing renders with hero, problem cards, FAQ
- [ ] Click "Ver demo en vivo" → land on `/demo` (existing CVScreener SPA)
- [ ] Back to landing → click "Precios" → 3 plan cards render
- [ ] Toggle Mensual/Anual → prices change ($97/$970, $297/$2970)
- [ ] Click "Iniciar prueba" on Individual (as anonymous) → redirects to `/login`
- [ ] Click "Empieza gratis 14 días" → Google OAuth flow → consent
- [ ] After consent, land on `/dashboard` with email + plan + usage cards
- [ ] Welcome email arrives at the Gmail address (skip if Resend not configured)
- [ ] Click "Ver mis vacantes" → empty state
- [ ] Click "+ Nueva vacante" → fill title + description → "Crear" → row appears
- [ ] Click the job title → `/jobs/:id` page renders with job header
- [ ] Add candidate via "Subir archivo" tab → upload a real PDF or DOCX → row appears with extracted name
- [ ] Click "Analizar" → ~3-5 seconds → score + strengths + gaps + interview question render inline
- [ ] Click "↓ Descargar PDF" → browser downloads `hrscout_<name>.pdf` opens cleanly
- [ ] Go back to `/precios` → click "Empezar 14 días gratis" on Individual → Stripe Checkout opens
- [ ] Use test card `4242 4242 4242 4242`, any future expiry, any CVC → completes
- [ ] Land on `/dashboard?upgraded=1` → user's plan in nav now says "Individual"
- [ ] In dashboard, click "Cerrar sesión" → land on `/` as anonymous

---

## 3 · External services — one-time setup

### Stripe (Day 6 ops)

- [ ] In Stripe Dashboard test mode, create 4 prices via
      `cd backend && .venv/Scripts/python.exe scripts/setup_stripe.py`
- [ ] Paste the 4 `STRIPE_PRICE_*=price_xxx` lines into `backend/.env`
- [ ] Install Stripe CLI (`stripe login`) for local webhook testing
- [ ] Run `stripe listen --forward-to localhost:8004/api/billing/webhook`
      → copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`
- [ ] For prod: in Stripe Dashboard → Developers → Webhooks → Add endpoint
      with URL `https://hrscout-api.onrender.com/api/billing/webhook`, select
      events `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.payment_failed` → copy
      `whsec_...` into Render env

### Resend (Day 10 ops)

- [ ] Create account at https://resend.com (free tier 3K emails/mo)
- [ ] Add domain `hrscout.mx` → add the 3 DNS records (DKIM + SPF + return-path)
      they provide to your DNS host
- [ ] Wait for "Verified" badge (usually < 1 hour)
- [ ] Generate API key → paste into `RESEND_API_KEY=re_xxx` in `.env`

### Domain (post-launch nice-to-have)

- [ ] Buy `hrscout.mx` at https://www.registry.mx/ (~$300 MXN/yr)
- [ ] Point DNS:
  - [ ] `hrscout.mx` + `www.hrscout.mx` → Vercel
  - [ ] `hrscout-api.onrender.com` is fine; no custom domain needed for the API at MVP

---

## 4 · Production deploy

### Backend → Render

- [ ] Create new Web Service from the GitHub repo, root = `backend/`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Instance: Starter ($7/mo, no cold start — required for OAuth callback latency)
- [ ] Add Postgres → Starter ($7/mo, 1 GB) → copy `DATABASE_URL` into env
- [ ] Set env vars in Render dashboard (copy from local `.env`):
      `JWT_SECRET`, `FERNET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `OAUTH_REDIRECT_URI=https://hrscout-api.onrender.com/api/auth/google/callback`,
      `FRONTEND_POST_LOGIN_URL=https://hr-scout-llm.vercel.app/dashboard`,
      `GROQ_API_KEY`, `STRIPE_*` (5 vars + 4 price IDs + webhook), `RESEND_API_KEY`,
      `ALLOWED_ORIGINS=https://hr-scout-llm.vercel.app,https://hrscout.mx`
- [ ] Update Google OAuth Authorized Redirect URI list in
      https://console.cloud.google.com/apis/credentials with the Render callback URL
- [ ] Deploy → check `https://hrscout-api.onrender.com/api/health` returns
      `{"status":"ok","db_ok":true,...}`

### Frontend → Vercel

- [ ] Existing project `hr-scout-llm` auto-deploys from main on push
- [ ] In Vercel dashboard, add env var:
      `VITE_API_URL=https://hrscout-api.onrender.com`
- [ ] Trigger a redeploy (env changes need a fresh build)
- [ ] Verify https://hr-scout-llm.vercel.app/ shows the new landing
- [ ] Visit `/precios` direct → no 404 (vercel.json rewrites work)

---

## 5 · Post-launch ops (week 1)

- [ ] Daily: check `/api/health` returns 200 (5 min/day)
- [ ] Daily: check Render logs for unhandled exceptions
- [ ] Daily: check Stripe Dashboard for failed payments / churn signals
- [ ] After 5 trial signups: schedule a 30-min Zoom with each (spec §18)
- [ ] After 10 trial signups: re-evaluate the 30-day money-back guarantee
      (Decision C2 — deferred to month 2)
- [ ] At 50 trial signups OR 5 paying customers: write a short retrospective
      and update `docs/COMMERCIAL_LAUNCH_SPEC.md` §17/18

---

## GO criterion

Everything above checked = **launch outbound LinkedIn campaign** (50 cold
messages to reclutadoras CDMX with the script in
sales-psych agent's draft).

If anything above is yellow/red, fix before sending the first outbound
message. A broken signup loses a lead permanently; a 1-day delay loses
nothing.

---

## Known follow-ups (post-launch backlog)

- Light theme polish (currently dark-only, toggle hidden per BRAND.md §2.4)
- Agency PDF branding (custom logo + colors per recruiting firm)
- Bulk upload (multi-file) endpoint
- LinkedIn Chrome extension (scrape profile → analyze)
- ATS integrations (Bizneo first per spec §11)
- CFDI auto-issuance (currently manual)
- Trial-to-pay conversion drip (3-email sequence)
- "?return=path" preservation through OAuth round-trip so pricing CTAs
  bounce back to /precios after login instead of /dashboard
- LFPDPPP purge cron (currently soft-delete only; the 30-day hard
  purge lives in spec §4 but the cron is unwritten)

*Last updated: 2026-05-17 · Christian Hernandez*
