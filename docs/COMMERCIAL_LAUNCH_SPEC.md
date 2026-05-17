# HRScout — Commercial Launch Spec (Phase 1)

> **Status:** Draft for review · **Owner:** Christian Hernandez · **Target launch:** 10 working days from sign-off
> **Audience:** reclutadoras independientes + agencias de RRHH en MX (CDMX, GDL, MTY)

---

## 1. Goal

Convert HRScout from a public demo SPA into a **paid SaaS** with auth, billing,
persistence, and PDF upload. Ship a landing that converts visitors to a
14-day free trial, then to a paid plan.

### Success metrics (first 60 days)

| Metric | Target | How measured |
|---|---|---|
| Trial signups | 30 | Stripe + Posthog funnel |
| Trial → paid conversion | ≥ 15% | Stripe subscription created |
| Paying customers (month 2) | 5+ | `subscriptions.status = active` |
| MRR (month 2) | ≥ $500 USD (~$9K MXN) | Stripe |
| Churn (first 60d) | ≤ 10% | Stripe cancellations |

5 customers × avg $100 USD = $500 MRR. Covers infra ($14/mo) ~36×.

---

## 2. Pricing (locked)

| Plan | Price | Limits | Target buyer |
|---|---|---|---|
| **Free trial** | $0 × 14 días, no card | 5 análisis total, 1 job description | Anyone signing up |
| **Individual** | $97 USD/mo (~$1,700 MXN) | 100 análisis/mes, 5 jobs guardados, export PDF | Reclutador freelance |
| **Agency** | $297 USD/mo (~$5,200 MXN) | 500 análisis/mes, jobs ilimitados, branding PDF, hasta 3 usuarios | Agencia chica (2-10 personas) |

Both paid plans annual option: 2 meses gratis (=$970 USD individual / $2,970 USD agency).

Overage on Individual: $1 USD por análisis extra (auto-charge or block — TBD with Christian).

---

## 3. Architecture

### Frontend (already exists — keep)
- React 18 + Vite 5
- Vercel deploy (already wired at hr-scout-llm.vercel.app)
- Add: auth routes, paywall guards, file upload component, dashboard layout

### Backend (NEW — to build)
- Python 3.12 + FastAPI (mirror of NexusForge/Verificarro stack — proven)
- Render Web Service ($7/mo)
- Postgres on Render Starter ($7/mo) — schema below

### Why FastAPI not Express
- Christian's deep familiarity (NexusForge runs on it)
- Pydantic v2 validation native (matches existing code conventions)
- pdfplumber/pypdf are Python-only-friendly
- Async out of the box for Claude API calls

### External services
- **Anthropic API** (Claude Sonnet 4.6) — main analysis engine, server-side
- **Groq** (llama-3.3-70b) — free fallback, server-side
- **Stripe** — checkout + subscriptions + webhooks
- **Google OAuth** — primary auth (reclutadoras live on Google Workspace)
- **Resend** — transactional email (welcome, trial expiring, receipts)

---

## 4. Database schema (Postgres)

```sql
-- users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  google_sub      TEXT UNIQUE,                    -- Google OAuth subject
  password_hash   TEXT,                            -- nullable if OAuth-only
  plan            TEXT NOT NULL DEFAULT 'trial',   -- trial | individual | agency
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- organizations (for Agency plan: up to 3 users share org + jobs)
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  owner_id        UUID REFERENCES users(id) NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'agency',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organization_members (
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member',   -- owner | member
  added_at        TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- jobs (saved job descriptions)
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  org_id          UUID REFERENCES organizations(id),    -- nullable for solo
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  language        TEXT NOT NULL DEFAULT 'es',
  created_at      TIMESTAMPTZ DEFAULT now(),
  archived_at     TIMESTAMPTZ
);

-- candidates (uploaded CVs, normalized text only — no PDF storage)
CREATE TABLE candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  org_id          UUID REFERENCES organizations(id),
  full_name       TEXT,                              -- extracted from CV
  email           TEXT,                              -- extracted, nullable
  cv_text         TEXT NOT NULL,                     -- normalized plain text
  cv_source       TEXT NOT NULL,                     -- 'paste' | 'pdf' | 'docx'
  filename        TEXT,                              -- original filename if uploaded
  pii_encrypted   BOOLEAN DEFAULT TRUE,              -- Fernet encrypt full_name + email at rest
  created_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ                        -- soft delete for LFPDPPP compliance
);

-- analyses (one per job × candidate run)
CREATE TABLE analyses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) NOT NULL,
  job_id            UUID REFERENCES jobs(id) NOT NULL,
  candidate_id      UUID REFERENCES candidates(id) NOT NULL,
  score             INTEGER NOT NULL,                -- 0-100
  local_score       INTEGER,
  ai_score          INTEGER,
  confidence        TEXT,                            -- high | medium | low
  strengths         JSONB,                           -- array
  gaps              JSONB,
  verdict           TEXT,
  action            TEXT,                            -- interview | waitlist | discard
  interview_question TEXT,
  analysis_mode     TEXT NOT NULL,                   -- local | groq | claude | tool_use
  tool_calls_used   INTEGER,
  latency_ms        INTEGER,
  cost_cents        INTEGER,                         -- for usage tracking
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analyses_user_created ON analyses(user_id, created_at DESC);
CREATE INDEX idx_jobs_user ON jobs(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_candidates_user ON candidates(user_id) WHERE deleted_at IS NULL;

-- usage_events (rate limiting + monthly counter)
CREATE TABLE usage_events (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) NOT NULL,
  event_type      TEXT NOT NULL,                     -- 'analysis' | 'pdf_export' | 'tool_use'
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usage_user_month ON usage_events(user_id, created_at DESC);
```

### Encryption at rest

`candidates.full_name` and `candidates.email` are encrypted with Fernet
(`AES-128-CBC + HMAC`) using a per-deployment key in env. This protects
PII in case of DB dump leak. Same pattern as Verificarro.

### Soft delete + LFPDPPP

`deleted_at` is set when a user requests deletion. A weekly cron purges
rows older than 30 days (legal retention buffer). Mexican LFPDPPP (Ley
Federal de Protección de Datos Personales en Posesión de los
Particulares) requires us to honor deletion requests within 20 days.

---

## 5. API endpoints

### Auth
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/google/start` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | Exchange code, mint JWT, set httpOnly cookie |
| POST | `/api/auth/register` | Email + password signup (fallback) |
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Returns current user + plan + usage counts |

### Jobs
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/jobs` | List user's jobs |
| POST | `/api/jobs` | Create job (title + description + language) |
| GET | `/api/jobs/{id}` | Get one job + recent analyses |
| PATCH | `/api/jobs/{id}` | Update title/description |
| DELETE | `/api/jobs/{id}` | Archive (soft) |

### Candidates
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/candidates` | Upload (multipart PDF/DOCX) OR paste text |
| GET | `/api/candidates?job_id=` | List candidates with their analyses |
| DELETE | `/api/candidates/{id}` | Soft delete (LFPDPPP) |

### Analyses
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/analyses` | Run analysis: `{job_id, candidate_id, mode: 'local'|'groq'|'claude'|'tool_use'}` |
| GET | `/api/analyses/{id}` | Get full analysis result |
| GET | `/api/analyses/{id}/report.pdf` | Download branded PDF report |
| GET | `/api/analyses?job_id=` | List + sort by score |

### Billing
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/billing/checkout` | Create Stripe Checkout session, returns URL |
| POST | `/api/billing/portal` | Create Stripe Customer Portal session |
| POST | `/api/billing/webhook` | Stripe webhook receiver |
| GET | `/api/billing/usage` | Current month usage vs plan limit |

### Health
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + DB + Anthropic ping |

---

## 6. Auth flow

1. User clicks "Empezar prueba gratis" on landing
2. Modal: "Continúa con Google" (primary) or "Email" (fallback)
3. Google OAuth flow → Google returns id_token
4. Backend verifies, upserts user, sets `trial_ends_at = now() + 14 days`,
   `plan = 'trial'`
5. Mint JWT (HS256, 7-day expiry), set as `httpOnly`, `Secure`,
   `SameSite=Lax` cookie
6. Refresh: rotating refresh token in separate cookie, exchanged at
   `/api/auth/refresh`

### Why JWT in cookie not localStorage
- Survives page reload without React state
- Not accessible to XSS (`httpOnly`)
- CSRF mitigated by `SameSite=Lax` + double-submit token on mutating ops

---

## 7. Stripe integration

### Products + prices to create in Stripe dashboard
```
Product: HRScout Individual
  Price 1: $97 USD recurring monthly       (id: price_individual_monthly)
  Price 2: $970 USD recurring yearly       (id: price_individual_yearly)

Product: HRScout Agency
  Price 1: $297 USD recurring monthly      (id: price_agency_monthly)
  Price 2: $2970 USD recurring yearly      (id: price_agency_yearly)
```

### Webhook events to handle
- `checkout.session.completed` → update `users.plan` + `stripe_subscription_id`
- `customer.subscription.updated` → sync plan changes
- `customer.subscription.deleted` → downgrade to `trial_expired`
- `invoice.payment_failed` → email user, grace period 3 days, then suspend

### Trial enforcement
- Free trial: hard cap at 5 analyses, enforced server-side on `POST /api/analyses`
- After `trial_ends_at`: read-only (can view history, can't run new analyses)

---

## 8. File upload (PDF/DOCX)

**Required for launch** — reclutadoras live in PDFs.

- Accept: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, max 10 MB
- Server-side parse:
  - PDF: `pdfplumber` (handles columns + tables better than pypdf)
  - DOCX: `python-docx`
- Extract: plain text → store in `candidates.cv_text`
- Try to extract `full_name` + `email` heuristically (regex for email; first line for name)
- **Never store the original file** — only the normalized text. Reduces
  storage cost, simplifies LFPDPPP compliance, and we don't need the
  source after extraction.

---

## 9. Landing page (rewrite of `/`)

### Hero
- Headline (ES): **"Filtra 100 CVs en 5 minutos. Sin sesgos. Sin marathon de lectura."**
- Subhead: "HRScout analiza, puntúa y rankea candidatos contra tu vacante usando 4 agentes de IA. Resultado: una shortlist objetiva en segundos."
- CTA primary: "Empieza gratis 14 días — sin tarjeta"
- CTA secondary: "Ver demo en vivo" (loads sample analysis right there)

### Sections (in order)
1. **Problema** — 3 íconos: lectura repetitiva, sesgos inconscientes, fatiga del reclutador
2. **Solución** — demo interactivo: pega un job description, sube 3 CVs, ve los scores aparecer
3. **Cómo funciona** — diagrama 4 pasos (Upload → Pipeline 4 agentes → Score 0-100 → Reporte exportable)
4. **Características** — grid 6 features con íconos
5. **Precios** — 3 cards (Free trial / Individual / Agency) con toggle Mensual/Anual
6. **Testimonios** — placeholder "Próximamente". Reemplazar con 3 reales tras primeros clientes.
7. **FAQ** — 8 preguntas: ¿es legal? (sí, LFPDPPP), ¿guardan CVs? (encriptados, eliminables), ¿qué pasa post-trial?, ¿integración con LinkedIn?, ¿soporta DOCX?, ¿cancelo cuando?, ¿reembolsos?, ¿soporte?
8. **Footer** — links a Términos, Privacidad, Aviso LFPDPPP, contacto WhatsApp

### Visual style
- Mantener glassmorphism + framer-motion ya existente (es ventaja diferencial)
- Color primary: el #6366F1 indigo del logo existente
- Mode: dark por default, light toggle disponible

---

## 10. Legal copy (drafts to write)

- **Términos de servicio** — uso responsable, no garantía de contratación, propiedad intelectual
- **Aviso de Privacidad LFPDPPP** — qué datos recopilamos (CVs, contacto), finalidad (screening), terceros (Anthropic, Groq, Stripe, Render), derechos ARCO (Acceso, Rectificación, Cancelación, Oposición), contacto del responsable
- **Política de cookies** — solo esenciales (auth) + opcional analytics
- **Disclaimer prominente** en cada análisis: "El score es una herramienta de apoyo. La decisión final de contratación es responsabilidad del reclutador humano."

---

## 11. Mexican market specifics

### Plantillas de jobs preset (10 en español MX)
Reemplazar el actual "Especialista en IA" único por:
1. Desarrollador Backend (Python / Java / .NET)
2. Desarrollador Frontend (React / Angular / Vue)
3. Desarrollador Full Stack
4. Desarrollador Mobile (iOS / Android / React Native)
5. DevOps / SRE
6. Data Scientist / ML Engineer
7. Contador Público
8. Vendedor / Ejecutivo de Cuenta
9. Key Account Manager
10. Diseñador UX/UI

Cada plantilla con descripción real de ~150-300 palabras, skills MX-realistas
(menciones a STPS, IMSS, ERP locales como Aspel/CONTPAQi para contador).

### Pricing display
- Mostrar en USD (primary) y MXN (secondary) con disclaimer "Tipo de cambio
  Stripe — la factura final puede variar ±2%"
- CFDI: post-launch, NO en MVP. Si un cliente pide factura, emitir manualmente
  vía Fiscaltools o similar.

### Soporte
- WhatsApp Business directo (Christian) — botón flotante en landing
- Email: hola@hrscout.mx (cuando se compre dominio)
- Sin chat in-app en MVP

---

## 12. Infrastructure setup

### Render
- Web Service: `hrscout-api`, Python 3.12, Free tier no — Starter $7
  (no sleep, no cold start)
- Postgres: `hrscout-db`, Starter $7 (1 GB storage, no auto-suspend)
- Env vars:
  - `DATABASE_URL` (auto)
  - `JWT_SECRET` (gen 32-byte random)
  - `FERNET_KEY` (gen via cryptography.fernet.Fernet.generate_key())
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `ANTHROPIC_API_KEY`
  - `GROQ_API_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `ALLOWED_ORIGINS=https://hr-scout-llm.vercel.app,https://hrscout.mx`

### Vercel
- Existing project `hr-scout-llm` keeps working
- New env: `VITE_API_URL=https://hrscout-api.onrender.com`
- Custom domain when ready: `hrscout.mx` → buy in GoDaddy/NIC.mx (~$300 MXN/yr)

### Total monthly cost
| Item | Cost |
|---|---|
| Render Web | $7 |
| Render Postgres | $7 |
| Vercel | $0 |
| Anthropic API | ~$0.05-0.15 / análisis (variable) |
| Stripe | 3.6% + $3 MXN / transacción |
| Resend | $0 (free tier 3K emails/mo) |
| Dominio | $25/yr ≈ $2/mo |
| **Fixed total** | **~$16 USD/mo** |

---

## 13. 10-day execution plan

| Day | Deliverable | Validation |
|---|---|---|
| **1** | FastAPI scaffold + Postgres migrations (users, jobs, candidates, analyses, usage_events) | `alembic upgrade head` clean, `/api/health` returns 200 |
| **2** | Auth: Google OAuth + JWT cookie + `/api/auth/me` | Login → cookie set → me returns user |
| **3** | Jobs CRUD + Candidates CRUD (paste text only) | curl creates job, candidate, lists them |
| **4** | Analysis endpoint: port `services/api.js` logic server-side. Anthropic + Groq + local cascade. | POST /analyses returns score in <5s for sample CV |
| **5** | PDF/DOCX upload: pdfplumber + python-docx → extract → store text | Upload sample CV PDF, text extracted clean |
| **6** | Stripe: products + checkout + webhook handler + plan enforcement | Test card upgrades user.plan to 'individual' |
| **7** | Frontend: auth UI + dashboard layout + jobs list page | Login → see my jobs → create new |
| **8** | Frontend: analysis flow with file upload + results display (port existing components) | Upload PDF + select job → see score |
| **9** | Frontend: landing rewrite + pricing page + legal pages | Lighthouse ≥ 90, mobile responsive |
| **10** | Branded PDF export + Resend welcome email + final smoke test | Run full E2E: signup → upload → analyze → upgrade → see invoice |

Day 11: launch outbound LinkedIn campaign (50 messages to reclutadoras CDMX).

---

## 14. Out of scope (Phase 2 / Phase 3)

Explicit non-goals for the 10-day launch:

- Multi-user invitations within Agency plan (creates schema but no UI)
- LinkedIn Chrome extension
- ATS integrations (Bizneo, Greenhouse, Workable)
- WhatsApp Business API ingest
- CFDI invoice issuance
- Light theme polish (dark is default and looks good)
- Mobile native apps
- Bulk import from Google Drive / Dropbox
- Candidate tracking kanban (Applied → Interview → Hired)
- Multi-language UI beyond ES/EN
- White-label / custom domain per agency

These are real customer asks but none block first revenue.

---

## 15. Open decisions (need Christian to confirm)

1. **Overage policy on Individual plan**: hard block at 100/mo, or
   auto-charge $1 per extra? My vote: hard block + upgrade prompt
   (cleaner accounting, less surprise charges).
2. **Domain name**: `hrscout.mx` available? Or alternative
   (`hr-scout.mx`, `hrscout.com.mx`, etc.)
3. **Agency seat count**: 3 users included? Or 5? Up-charge per
   extra seat ($30/mo)?
4. **Trial duration**: 14 days or 7? My vote: 14 (more time = more
   activation events = better conversion in B2B).
5. **Email-only signup** vs Google-only at launch? My vote: both
   day-1 (Google primary, email fallback).
6. **Annual discount**: 2 months free (= 16% off) or 3 months
   (= 25% off)?
7. **Color of CTA button**: keep indigo or switch to green for
   "buy" semantics? (low priority)

Each of these is a 1-line decision; can be answered async via WhatsApp.

---

## 16. Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Anthropic API outage during demo | Low | High | Fallback to Groq + local scoring (already implemented) |
| Render Postgres free tier sunset (already happened on Verificarro) | Medium | High | Starting on Starter $7 from day 1, not free |
| Stripe MX availability for individual sellers | Low | Critical | Christian already onboarded for Verificarro — works |
| Reclutadoras don't trust AI scoring | High | High | Disclaimer prominent, "decisión final humana", show methodology in analysis result |
| LFPDPPP complaint | Low | Critical | Aviso de privacidad day 1, soft delete + 30-day purge, encryption at rest |
| Bundle bloat from new pages | Medium | Medium | Code-split landing/pricing/legal from app (already 397 kB main — keep < 500 kB) |
| Outbound LinkedIn gets account flagged | Medium | Medium | Manual messaging, ≤ 30/day, personalized opener referencing their company |

---

## 17. Definition of done (launch criteria)

Day-10 launch is GO when:

- [ ] All 10 day-deliverables complete + tested
- [ ] Smoke test passes: anonymous user signs up via Google → uploads
      PDF CV → runs analysis → gets score < 5s → upgrades to Individual
      via Stripe test card → sees confirmation
- [ ] All 8 critical pages live: `/` landing, `/precios`, `/login`,
      `/dashboard`, `/jobs`, `/jobs/{id}`, `/terminos`, `/privacidad`
- [ ] Stripe webhook verified (real event from Stripe dashboard
      lands and updates DB)
- [ ] `/api/health` returns 200 with DB + Anthropic ping green
- [ ] At least 5 plantillas MX en español preset disponibles
- [ ] README on GitHub updated with link to live SaaS
- [ ] LinkedIn outbound script drafted (separate doc)

---

## 18. Post-launch immediate next moves (week 3)

1. First 3 customer interviews (30 min Zoom each) — what's missing,
   what would they pay 2× for?
2. Analytics review: where do people drop in funnel?
3. Pricing experiment: is $97 too low? Too high?
4. Decide Phase 2 priority based on real feedback (not assumptions)

---

## 19. Decisions log (closed)

All open items in §15 and the calibration-run copy questions are
resolved. Agents and engineering must follow these as canonical.

### From §15 (product/infra) — resolved 2026-05-17

| # | Decision | Resolution |
|---|---|---|
| 1 | Overage on Individual plan | Hard block at 100 análisis/mo + prompt upgrade. No surprise charges. |
| 2 | Domain name | `hrscout.mx` (target) |
| 3 | Agency plan seats included | 3 seats |
| 4 | Trial duration | 14 días |
| 5 | Signup paths at launch | Google OAuth + email/password, both day 1 |
| 6 | Annual discount | 2 meses gratis (~16% off) |
| 7 | CTA color | Indigo (brand color) — keep |

### From copy calibration run — resolved 2026-05-17

| # | Decision | Resolution |
|---|---|---|
| C1 | Hero CTA wording | "Empieza gratis 14 días" (imperativo) |
| C2 | 30-day money-back guarantee | **Defer to month 2.** Pre-launch sin churn data — risk of abuse on a $97/mo product. Re-evaluate once we have ≥10 paying customers. |
| C3 | "Más popular" badge on Agency tier | **Yes.** Defendible internally: "tier que más recomendamos". Standard B2B anchoring. |
| C4 | Social Proof section pre-testimonials | "Próximamente — primeros 20 usuarios" como invitación exclusiva. Reemplazar cuando haya 3 testimonios reales con foto+cargo+empresa. |
| C5 | Founder name in footer + WhatsApp CTA | **Yes** — "Hablar con Christian". Founder-led venta en MX SMB convierte mejor. |

### Open questions for the next session

None blocking Phase 1 Day 1. The following are nice-to-have once the
brand audit lands:

- `docs/BRAND.md` to be written by `hr-scout-brand` agent (paleta
  canonical, tipografía, tokens, voice & tone, do/don't)
- A11y audit pre-launch (Lighthouse ≥ 90 mobile + desktop)

---

*Last updated: 2026-05-17 · Christian Hernandez*
