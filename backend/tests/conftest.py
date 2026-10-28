"""Pytest fixtures for GhostTrace unit tests."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import init_db, reset_demo_dataset
from app.main import app


@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch):
    """Use a temporary database file for each test to ensure total isolation."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        test_db_path = tmp.name

    monkeypatch.setattr(settings, "database_path", test_db_path)
    init_db()
    reset_demo_dataset()

    yield

    try:
        if os.path.exists(test_db_path):
            os.remove(test_db_path)
    except Exception:
        pass


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)

