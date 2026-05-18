"""Seed the database with realistic Mexican-market demo data.

Idempotent: re-running adds nothing if the seed user already exists.
Safe to call from `docker compose --profile seed up seed`.

Generates:
  - 5 reclutadoras (1 trial, 2 individual, 1 agency owner, 1 agency member)
  - 1 organization (the agency)
  - 30 jobs MX-realistic (Backend, Frontend, Mobile, Data, Contador, KAM, ...)
  - 150 candidatos with Faker-style names + plausible CVs in Spanish MX
  - 80 analyses pre-computed (so the dashboard is populated, demo can be
    given without the LLM call delay)
  - usage_events to make quota dashboards look real

Distribution: most analyses skew interview/waitlist over discard, so
the demo screens are not depressing.

NO external API calls — analyses are generated with the LOCAL scorer
only (Day 4) so this script is hermetic and fast (~10s).
"""

from __future__ import annotations

import asyncio
import random
import sys
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

# Make sure we read DATABASE_URL from env (docker-compose sets it)
from app.config import get_settings
from app.crypto import encrypt_pii
from app.db.database import Base, engine
from app.db.models import (
    Analysis,
    Candidate,
    Job,
    Organization,
    OrganizationMember,
    UsageEvent,
    User,
)

# Pre-built deterministic data so the demo looks the same every time

SEED_USERS = [
    ("ana.ruiz@hrscout.demo",       "Ana Ruiz",        "trial",      None),
    ("carla.mendez@hrscout.demo",   "Carla Méndez",    "individual", None),
    ("luis.torres@hrscout.demo",    "Luis Torres",     "individual", None),
    ("marta.lopez@hrscout.demo",    "Marta López",     "agency",     "Talent MX"),
    ("pedro.ortega@hrscout.demo",   "Pedro Ortega",    "agency",     None),  # member of Talent MX
]

JOB_TEMPLATES = [
    ("Backend Senior Python", "Backend Senior\nRequisitos obligatorios:\nPython\nSQL\nFastAPI\n5+ años de experiencia\nDeseable: Docker, AWS\nInglés B2"),
    ("Backend Java Senior", "Backend Senior Java\nRequisitos obligatorios:\nJava\nSpring\nSQL\n4+ años de experiencia\nDeseable: Kafka, Kubernetes"),
    ("Backend .NET", "Backend .NET\nRequisitos obligatorios:\nC#\n.NET Core\nSQL Server\n3+ años de experiencia"),
    ("Frontend React Senior", "Frontend Senior\nRequisitos obligatorios:\nReact\nTypeScript\n4+ años de experiencia\nDeseable: Next.js, testing"),
    ("Frontend Vue Mid", "Frontend Mid Vue\nRequisitos:\nVue\nJavaScript\n2+ años de experiencia"),
    ("Mobile iOS Senior", "iOS Senior\nRequisitos obligatorios:\nSwift\niOS\n4+ años de experiencia"),
    ("Mobile Android Senior", "Android Senior\nRequisitos obligatorios:\nKotlin\nAndroid SDK\n4+ años de experiencia"),
    ("React Native Mid", "React Native Mid\nRequisitos:\nReact Native\nJavaScript\n2+ años de experiencia"),
    ("Full Stack Mid", "Full Stack\nRequisitos obligatorios:\nReact\nNode.js\nSQL\n3+ años de experiencia"),
    ("DevOps Senior", "DevOps Senior\nRequisitos obligatorios:\nDocker\nKubernetes\nAWS\nCI/CD\n4+ años de experiencia"),
    ("SRE Mid", "SRE\nRequisitos:\nLinux\nDocker\nKubernetes\n3+ años de experiencia"),
    ("Data Engineer", "Data Engineer\nRequisitos obligatorios:\nPython\nSQL\nSpark\n3+ años de experiencia"),
    ("Data Scientist", "Data Scientist\nRequisitos obligatorios:\nPython\nMachine Learning\nSQL\n3+ años de experiencia"),
    ("ML Engineer Senior", "ML Engineer Senior\nRequisitos obligatorios:\nPython\nTensorFlow\nML\n5+ años de experiencia"),
    ("Tech Lead Backend", "Tech Lead Backend\nRequisitos obligatorios:\nPython o Java\nLiderazgo de equipos\n6+ años de experiencia"),
    ("QA Automation", "QA Automation\nRequisitos obligatorios:\nCypress o Selenium\nJavaScript\n3+ años de experiencia"),
    ("Product Designer Senior", "Product Designer Senior\nRequisitos obligatorios:\nFigma\nDiseño de interacción\n4+ años de experiencia"),
    ("UX Researcher", "UX Researcher\nRequisitos:\nMetodologías de investigación\n3+ años de experiencia"),
    ("Project Manager", "Project Manager\nRequisitos obligatorios:\nScrum\nKanban\n4+ años de experiencia"),
    ("Scrum Master", "Scrum Master\nRequisitos obligatorios:\nScrum\nCSM certificación\n3+ años de experiencia"),
    ("Contador Público Senior", "Contador Público Senior\nRequisitos obligatorios:\nCFDI\nCONTPAQi o Aspel\n5+ años de experiencia\nManejo de SAT"),
    ("Analista Financiero Mid", "Analista Financiero\nRequisitos:\nExcel avanzado\nModelos financieros\n3+ años de experiencia"),
    ("Auditor Mid", "Auditor\nRequisitos obligatorios:\nLicenciatura en Contaduría\n3+ años de experiencia"),
    ("Vendedor B2B Senior", "Ejecutivo de Ventas B2B\nRequisitos obligatorios:\nVentas consultivas\nHubSpot\n5+ años de experiencia"),
    ("Key Account Manager", "Key Account Manager\nRequisitos obligatorios:\nGestión de cuentas\nCRM\n4+ años de experiencia"),
    ("SDR Junior", "SDR Junior\nRequisitos:\nLlamadas en frío\nInglés B2\n1+ año de experiencia"),
    ("Customer Success Manager", "CSM\nRequisitos obligatorios:\nGestión de clientes SaaS\n3+ años de experiencia"),
    ("Marketing Digital Mid", "Marketing Digital Mid\nRequisitos:\nGoogle Ads\nMeta Ads\nSEO\n3+ años de experiencia"),
    ("Content Manager", "Content Manager\nRequisitos:\nRedacción\nSEO\n2+ años de experiencia"),
    ("HR Business Partner", "HR Business Partner\nRequisitos obligatorios:\nGestión de talento\nLicenciatura en Psicología o Administración\n4+ años de experiencia"),
]

NAMES_F = [
    "Ana García", "María López", "Sofía Hernández", "Carmen Martínez", "Lucía Rodríguez",
    "Valentina Pérez", "Isabella González", "Camila Sánchez", "Mariana Ramírez", "Daniela Torres",
    "Andrea Flores", "Paola Rivera", "Karla Mendoza", "Natalia Castillo", "Fernanda Vargas",
    "Mónica Aguilar", "Patricia Núñez", "Verónica Romero", "Elena Cruz", "Beatriz Reyes",
]
NAMES_M = [
    "Carlos García", "Luis Hernández", "José Martínez", "Miguel Rodríguez", "Juan Pérez",
    "Diego González", "Andrés Sánchez", "Fernando Ramírez", "Roberto Torres", "Pablo Flores",
    "Eduardo Rivera", "Daniel Mendoza", "Alejandro Castillo", "Ricardo Vargas", "Mauricio Aguilar",
    "Javier Núñez", "Sergio Romero", "Arturo Cruz", "Héctor Reyes", "Adrián Jiménez",
]

CV_TEMPLATES = {
    "Backend Senior Python": [
        "{name}\nSenior Backend Developer\n{exp} años de experiencia con Python, FastAPI, PostgreSQL, asyncio.\nLiderazgo de equipo de {team} ingenieros.\nDocker, AWS, CI/CD con GitHub Actions.\nInglés C1.\nMaestría en Ciencias Computacionales.",
        "{name}\nDesarrollador Backend\n{exp} años usando Django y Flask.\nExperiencia con Python, PostgreSQL, Redis.\nIngeniería en Sistemas, ITESM.\nInglés B2.",
        "{name}\nFull-stack lead\n{exp} años total, últimos 3 enfocados en Python/FastAPI.\nPython, JavaScript, AWS Lambda.\nLicenciatura en Computación, UNAM.",
    ],
    "Backend Java Senior": [
        "{name}\nSenior Java Developer\n{exp} años con Java, Spring Boot, Hibernate, Kafka.\nLiderazgo técnico en proyectos bancarios.\nKubernetes en producción.\nIngeniería en Sistemas, UAM.\nInglés C1.",
    ],
    "Frontend React Senior": [
        "{name}\nSenior Frontend\n{exp} años con React, TypeScript, Next.js.\nDiseño de design systems, Storybook.\nTesting con Jest y Cypress.\nInglés C1.",
    ],
    "Contador Público Senior": [
        "{name}\nContador Público\n{exp} años de experiencia.\nManejo de CFDI 4.0, CONTPAQi y Aspel.\nDeclaraciones SAT mensuales y anuales.\nLicenciatura en Contaduría Pública, UNAM.",
    ],
    "Vendedor B2B Senior": [
        "{name}\nEjecutivo de Ventas B2B Senior\n{exp} años en ventas consultivas SaaS.\nHubSpot CRM, Salesforce.\nCierre de cuentas enterprise.\nInglés C1.",
    ],
}

GENERIC_CV = "{name}\n{title}\n{exp} años de experiencia.\nFormación: licenciatura.\nInglés intermedio.\nManejo de herramientas estándar del puesto."


async def main() -> int:
    settings = get_settings()
    print(f"[seed] env={settings.environment} db={settings.normalized_database_url.split('@')[-1].split('/')[0]}")

    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    # Ensure schema exists (idempotent — Alembic should have run by now)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        # Idempotency: check if the canonical seed user is already present
        existing = (
            await session.execute(select(User).where(User.email == SEED_USERS[0][0]))
        ).scalar_one_or_none()
        if existing:
            print("[seed] already seeded (ana.ruiz@hrscout.demo found) — exiting")
            return 0

        # ── Users + (optional) org ────────────────────────────────────────
        users: list[User] = []
        for email, name, plan, org_name in SEED_USERS:
            u = User(
                email=email,
                name=name,
                plan=plan,
                trial_ends_at=(
                    datetime.now(UTC) + timedelta(days=14) if plan == "trial" else None
                ),
            )
            session.add(u)
            users.append(u)
        await session.flush()

        org_owner = users[3]  # marta.lopez (agency)
        org_member = users[4]  # pedro.ortega
        org = Organization(name="Talent MX", owner_id=org_owner.id, plan="agency")
        session.add(org)
        await session.flush()
        session.add_all([
            OrganizationMember(org_id=org.id, user_id=org_owner.id, role="owner"),
            OrganizationMember(org_id=org.id, user_id=org_member.id, role="member"),
        ])
        await session.flush()

        # ── Jobs (30) distributed across users ─────────────────────────────
        jobs: list[Job] = []
        rng = random.Random(42)
        for i, (title, desc) in enumerate(JOB_TEMPLATES):
            owner = users[i % len(users)]
            j = Job(
                user_id=owner.id,
                org_id=org.id if owner.id in {org_owner.id, org_member.id} else None,
                title=title,
                description=desc,
                language="es",
                created_at=datetime.now(UTC) - timedelta(days=rng.randint(1, 45)),
            )
            session.add(j)
            jobs.append(j)
        await session.flush()
        print(f"[seed] {len(jobs)} jobs created")

        # ── Candidates (150) ──────────────────────────────────────────────
        candidates: list[Candidate] = []
        all_names = NAMES_F + NAMES_M
        for i in range(150):
            person = rng.choice(all_names)
            domain = rng.choice(["gmail.com", "outlook.com", "yahoo.com.mx", "hotmail.com"])
            email = (
                person.lower()
                .replace(" ", ".")
                .replace("á", "a").replace("é", "e").replace("í", "i")
                .replace("ó", "o").replace("ú", "u").replace("ñ", "n")
                + f"@{domain}"
            )
            # Pick a job to inspire the CV
            j = rng.choice(jobs)
            exp_years = rng.randint(1, 12)
            template_list = CV_TEMPLATES.get(j.title, [GENERIC_CV])
            cv_text = rng.choice(template_list).format(
                name=person, exp=exp_years, team=rng.randint(2, 8), title=j.title,
            )
            owner = next((u for u in users if u.id == j.user_id), users[0])
            c = Candidate(
                user_id=owner.id,
                org_id=j.org_id,
                full_name=encrypt_pii(person),
                email=encrypt_pii(email),
                cv_text=cv_text,
                cv_source=rng.choice(["paste", "pdf", "docx"]),
                pii_encrypted=True,
                created_at=datetime.now(UTC) - timedelta(days=rng.randint(0, 30)),
            )
            session.add(c)
            candidates.append(c)
        await session.flush()
        print(f"[seed] {len(candidates)} candidates created")

        # ── Analyses (80) — using local scorer for hermeticity ────────────
        from app.analysis.scorer import analyze_cv_local

        analysis_count = 0
        for _ in range(80):
            c = rng.choice(candidates)
            # Pick a job that belongs to the same user as the candidate (ownership)
            user_jobs = [j for j in jobs if j.user_id == c.user_id]
            if not user_jobs:
                continue
            j = rng.choice(user_jobs)
            result = analyze_cv_local(c.cv_text, j.description)
            # Map next-step text to action enum
            action = "interview" if result.score >= 80 else ("waitlist" if result.score >= 60 else "discard")
            session.add(Analysis(
                user_id=c.user_id,
                job_id=j.id,
                candidate_id=c.id,
                score=result.score,
                local_score=result.score,
                ai_score=None,
                confidence="n/a",
                strengths=result.fortalezas,
                gaps=result.brechas,
                verdict=result.veredicto,
                action=action,
                interview_question=result.pregunta_entrevista,
                analysis_mode="local",
                latency_ms=rng.randint(8, 35),
                created_at=datetime.now(UTC) - timedelta(days=rng.randint(0, 20), hours=rng.randint(0, 23)),
            ))
            session.add(UsageEvent(
                user_id=c.user_id,
                event_type="analysis",
                created_at=datetime.now(UTC) - timedelta(days=rng.randint(0, 20)),
            ))
            analysis_count += 1
        print(f"[seed] {analysis_count} analyses created")

        await session.commit()
        print("[seed] done.")
        print()
        print("Demo accounts (all use the same trial password flow — login via Google OAuth):")
        for email, name, plan, _ in SEED_USERS:
            print(f"  - {email:35s} {plan:10s} {name}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
