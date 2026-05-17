import pytest


@pytest.mark.asyncio
async def test_health_returns_200(client):
    response = await client.get("/api/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_payload_shape(client):
    response = await client.get("/api/health")
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert "version" in body
    assert "environment" in body
    assert "db_ok" in body
    assert "checked_at" in body


@pytest.mark.asyncio
async def test_health_db_ok_when_db_is_reachable(client):
    response = await client.get("/api/health")
    body = response.json()
    assert body["db_ok"] is True
    assert body["status"] == "ok"


@pytest.mark.asyncio
async def test_health_environment_is_development_in_tests(client):
    response = await client.get("/api/health")
    body = response.json()
    assert body["environment"] == "development"
