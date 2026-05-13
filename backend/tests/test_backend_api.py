from io import BytesIO

from PIL import Image

from backend import main


def test_root_endpoint_returns_project_metadata(client):
    response = client.get("/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Welcome to Florana Backend"
    assert payload["health"] == "/health"
    assert payload["database_status"] == "connected"


def test_health_endpoint_reports_backend_status(client, monkeypatch):
    monkeypatch.setattr(main, "model", object())

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["server"] == "Florana Backend"
    assert payload["ai_model"] == {"loaded": True, "status": "ready"}


def test_signup_and_login_use_local_storage(client):
    signup_response = client.post(
        "/auth/signup",
        json={
            "full_name": "Test User",
            "email": "Tester@Example.com",
            "password": "secret123",
            "contact": "0771234567",
            "location": "Colombo",
        },
    )

    assert signup_response.status_code == 200
    signup_payload = signup_response.json()
    assert signup_payload["storage"] == "local"
    assert signup_payload["user"]["email"] == "tester@example.com"
    assert signup_payload["access_token"]
    assert signup_payload["refresh_token"]

    login_response = client.post(
        "/auth/login",
        json={
            "email": "TESTER@example.com",
            "password": "secret123",
        },
    )

    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["message"] == "Login successful"
    assert login_payload["storage"] == "local"
    assert login_payload["user"]["email"] == "tester@example.com"


def test_signup_rejects_duplicate_email(client):
    payload = {
        "full_name": "Duplicate User",
        "email": "duplicate@example.com",
        "password": "secret123",
        "contact": "0771234567",
        "location": "Kandy",
    }

    first_response = client.post("/auth/signup", json=payload)
    second_response = client.post("/auth/signup", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Email already registered"


def test_feedback_lifecycle_uses_local_storage(client):
    empty_response = client.get("/feedback/")
    assert empty_response.status_code == 200
    assert empty_response.json() == []

    create_response = client.post(
        "/feedback/",
        json={
            "rating": 5,
            "message": "  Florana is very helpful for daily plant care.  ",
        },
    )

    assert create_response.status_code == 200
    created_feedback = create_response.json()
    assert created_feedback["rating"] == 5
    assert created_feedback["message"] == "Florana is very helpful for daily plant care."

    list_response = client.get("/feedback/")
    assert list_response.status_code == 200
    listed_feedback = list_response.json()
    assert len(listed_feedback) == 1
    assert listed_feedback[0]["message"] == "Florana is very helpful for daily plant care."

    clear_response = client.delete("/feedback/")
    assert clear_response.status_code == 200
    assert clear_response.json()["message"] == "Feedback cleared successfully"
    assert client.get("/feedback/").json() == []


def test_care_reminders_return_defaults_and_save_updates(client):
    default_response = client.get("/care-reminders/")

    assert default_response.status_code == 200
    assert default_response.json()["wateringTime"] == "07:00"

    updated_payload = {
        "options": {
            "watering": True,
            "fertilizing": True,
            "pruning": False,
            "repotting": False,
            "sunlight": True,
        },
        "customNotes": ["Rotate pots every Sunday"],
        "summaryMode": "weekly",
        "notifications": {"push": False, "email": True},
        "wateringTime": "18:30",
        "inAppMessages": [{"id": 1, "text": "Test reminder"}],
    }
    save_response = client.put("/care-reminders/", json=updated_payload)

    assert save_response.status_code == 200
    assert save_response.json()["wateringTime"] == "18:30"
    assert save_response.json()["summaryMode"] == "weekly"

    persisted_response = client.get("/care-reminders/")
    assert persisted_response.status_code == 200
    assert persisted_response.json()["customNotes"] == ["Rotate pots every Sunday"]
    assert persisted_response.json()["notifications"] == {"push": False, "email": True}


def test_quick_tips_endpoint_returns_structured_payload(client):
    response = client.get("/quick-tips")

    assert response.status_code == 200
    payload = response.json()
    assert "generated_at" in payload
    assert "context" in payload
    assert len(payload["tips"]) == 4
    assert all("title" in tip and "detail" in tip for tip in payload["tips"])


def test_predict_requires_image_file(client):
    response = client.post("/predict")

    assert response.status_code == 400
    assert response.json()["detail"] == "Image file is required"


def test_predict_rejects_invalid_file_extension(client):
    response = client.post(
        "/predict",
        files={"file": ("notes.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid image format"


def test_predict_returns_unsupported_for_unrecognized_leaf_image(client, monkeypatch):
    monkeypatch.setattr(main, "predict_image", lambda _: ("Needs closer inspection", 0.0, []))

    image_bytes = BytesIO()
    Image.new("RGB", (8, 8), color=(0, 180, 0)).save(image_bytes, format="PNG")
    response = client.post(
        "/predict",
        files={"file": ("leaf.png", image_bytes.getvalue(), "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "unsupported"
    assert payload["prediction"] == "Needs closer inspection"
    assert payload["image_url"] is None


def test_prediction_helpers_normalize_labels_and_margins():
    assert main.normalize_prediction_label("fresh_leaf") == "Fresh Leaf"
    assert main.normalize_prediction_label("healthy plant") == "Healthy"
    assert main.normalize_prediction_label("") == "Unknown"
    assert main.get_prediction_margin(
        [
            {"label": "Rust", "confidence": 0.82},
            {"label": "Leaf Spot", "confidence": 0.53},
        ]
    ) == 0.2899999999999999
