"""Tests for main FastAPI application."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, AsyncSessionLocal
import asyncio


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Initialize test database."""
    await init_db()


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "endpoints" in data
    assert "health" in data["endpoints"]
    assert "websocket" in data["endpoints"]


@pytest.mark.asyncio
async def test_get_roi_data_empty():
    """Test getting ROI data when database is empty."""
    from app.main import get_roi_data
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSessionLocal() as session:
        response = await get_roi_data(session)
        assert response.count == 0
        assert response.data == []


def test_websocket_endpoint_exists(client):
    """Test that WebSocket endpoint is accessible (basic check)."""
    # Note: Full WebSocket testing would require a WebSocket test client
    # This is a basic check that the app has the route
    routes = [route.path for route in app.routes]
    assert "/ws/stream" in routes