from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.routers import health

settings = get_settings()

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("hrscout")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log.info("HRScout backend starting — env=%s version=%s", settings.environment, __version__)
    log.info("DB URL kind=%s", "sqlite" if settings.is_sqlite else "postgres")
    yield
    log.info("HRScout backend shutting down")


app = FastAPI(
    title="HRScout API",
    version=__version__,
    description="AI-powered CV screening backend. Spec: docs/COMMERCIAL_LAUNCH_SPEC.md",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
