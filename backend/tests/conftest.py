from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend import database
from backend.main import app
from backend.utils import auth_store, local_store


def _patch_storage_path(monkeypatch: pytest.MonkeyPatch, target_module, attr_name: str, directory: Path) -> None:
    monkeypatch.setattr(target_module, attr_name, str(directory / Path(getattr(target_module, attr_name)).name))


@pytest.fixture(autouse=True)
def isolate_backend_state(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    for attr_name in (
        "PLANTS_FILE",
        "PRODUCTS_FILE",
        "GROWTH_FILE",
        "PREDICTIONS_FILE",
        "FEEDBACK_FILE",
        "CARE_REMINDERS_FILE",
    ):
        _patch_storage_path(monkeypatch, local_store, attr_name, tmp_path)

    for attr_name in ("USERS_FILE", "LOGIN_HISTORY_FILE"):
        _patch_storage_path(monkeypatch, auth_store, attr_name, tmp_path)

    def _mock_connect_to_mongo():
        monkeypatch.setattr(database, "connection_status", "connected")
        return True

    monkeypatch.setattr(database, "connect_to_mongo", _mock_connect_to_mongo)
    monkeypatch.setattr(database, "get_users_collection", lambda: None)
    monkeypatch.setattr(database, "get_plants_collection", lambda: None)
    monkeypatch.setattr(database, "get_products_collection", lambda: None)
    monkeypatch.setattr(database, "get_prediction_collection", lambda: None)
    monkeypatch.setattr(database, "get_growth_collection", lambda: None)
    monkeypatch.setattr(database, "get_login_history_collection", lambda: None)
    monkeypatch.setattr(database, "get_feedback_collection", lambda: None)
    monkeypatch.setattr(database, "get_care_reminders_collection", lambda: None)
    monkeypatch.setattr(database, "check_db_connection", lambda: {"status": "success", "message": "MongoDB is online"})
    monkeypatch.setattr(database, "connection_status", "connected")


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
