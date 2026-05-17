from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()

# SQLite needs check_same_thread=False; Postgres ignores connect_args.
_connect_args: dict = {}
if _settings.is_sqlite:
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    _settings.normalized_database_url,
    echo=_settings.environment == "development" and _settings.log_level == "DEBUG",
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
