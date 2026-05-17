import importlib

import app.config as config_module


def _reload_settings():
    importlib.reload(config_module)
    config_module.get_settings.cache_clear()
    return config_module.get_settings()


def test_postgres_url_normalization(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@h:5432/db")
    s = _reload_settings()
    assert s.normalized_database_url == "postgresql+asyncpg://u:p@h:5432/db"


def test_postgresql_url_gets_asyncpg(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@h:5432/db")
    s = _reload_settings()
    assert s.normalized_database_url == "postgresql+asyncpg://u:p@h:5432/db"


def test_asyncpg_url_unchanged(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h:5432/db")
    s = _reload_settings()
    assert s.normalized_database_url == "postgresql+asyncpg://u:p@h:5432/db"


def test_allowed_origins_parsing(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.com, https://b.com ,https://c.com")
    s = _reload_settings()
    assert s.allowed_origins_list == ["https://a.com", "https://b.com", "https://c.com"]


def test_is_sqlite_detection(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    s = _reload_settings()
    assert s.is_sqlite is True

    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h/db")
    s = _reload_settings()
    assert s.is_sqlite is False
