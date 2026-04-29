# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os
import io
import json
import numpy as np
from PIL import Image
from datetime import datetime
from bson import ObjectId

try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
except Exception as e:
    load_model = None
    image = None
    print("TensorFlow unavailable:", e)

# ----------------- Import Routers -----------------
try:
    from .routes.auth import router as auth_router
    from .routes.feedback import router as feedback_router
    from .routes.plant import router as plant_router
    from .routes.growth import router as growth_router
    from .routes.payment import router as payment_router
    from .routes.shop import router as shop_router
    from . import database
    from .utils import local_store
    from .utils.paths import UPLOAD_DIR, build_upload_api_path, build_upload_disk_path, build_upload_public_path
except ImportError:
    from routes.auth import router as auth_router
    from routes.feedback import router as feedback_router
    from routes.plant import router as plant_router
    from routes.growth import router as growth_router
    from routes.payment import router as payment_router
    from routes.shop import router as shop_router
    import database
    from utils import local_store
    from utils.paths import UPLOAD_DIR, build_upload_api_path, build_upload_disk_path, build_upload_public_path

# ----------------- Firebase Push Notifications -----------------
from apscheduler.schedulers.background import BackgroundScheduler

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except Exception:
    firebase_admin = None
    credentials = None
    messaging = None

FIREBASE_KEY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firebase-key.json")

if firebase_admin and os.path.exists(FIREBASE_KEY_PATH):
    try:
        cred = credentials.Certificate(FIREBASE_KEY_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized")
    except Exception as e:
        print("Firebase initialization failed:", e)
else:
    print("Firebase disabled: firebase-key.json not found")

# ----------------- FastAPI App Setup -----------------
app = FastAPI(title="Florana Backend")

# Static files for uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= STARTUP EVENT =================
@app.on_event("startup")
def startup_event():
    """Print startup information."""
    print("\n" + "=" * 60)
    print("FLORANA BACKEND STARTUP")
    print("=" * 60)
    print("Server: check the Uvicorn URL shown below")
    print("Docs path: /docs")
    print("Health path: /health")
    print(f"Database: {database.connection_status}")

    if database.connection_status == "disconnected":
        print("\nWARNING: MongoDB is not connected!")
        print("To start MongoDB:")
        print("   Windows: net start MongoDB or mongod")
        print("   macOS: brew services start mongodb-community")
        print("   Linux: sudo systemctl start mongod")
        print("\nFlorana will fall back to local JSON storage for auth and plant data until MongoDB is available.")

    print("=" * 60 + "\n")


# Routers
app.include_router(auth_router)
app.include_router(feedback_router)
app.include_router(plant_router)
app.include_router(growth_router)
app.include_router(payment_router)
app.include_router(shop_router)


# ================= HEALTH CHECK ENDPOINT =================
@app.get("/health")
def health_check():
    """Check backend and database health status."""
    db_status = database.check_db_connection()

    return {
        "status": "ok" if db_status["status"] == "success" else "degraded",
        "server": "Florana Backend",
        "database": db_status,
        "ai_model": {
            "loaded": model is not None,
            "status": "ready" if model is not None else "offline",
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to Florana Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "database_status": database.connection_status,
    }


# ================= Load AI Model =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ai", "plant_disease_model.keras")
CLASS_PATH = os.path.join(BASE_DIR, "ai", "class_names.json")
MIN_CONFIDENCE_THRESHOLD = 0.65


def normalize_prediction_label(raw_label: str) -> str:
    normalized = raw_label.replace("_", " ").strip()
    lowered = normalized.lower()

    if lowered in {"fresh leaf", "healthy", "healthy plant"}:
        return "Healthy"

    if not normalized:
        return "Unknown"

    return " ".join(word.capitalize() for word in normalized.split())

try:
    if load_model is None:
        raise RuntimeError("TensorFlow is not installed")
    model = load_model(MODEL_PATH)
    print("AI model loaded successfully")
except Exception as e:
    print("Error loading model:", e)
    model = None

try:
    with open(CLASS_PATH, "r") as f:
        class_data = json.load(f)
    if isinstance(class_data, dict):
        class_names = {v: k for k, v in class_data.items()}
    else:
        class_names = {i: name for i, name in enumerate(class_data)}
    print("Class names loaded successfully")
except Exception as e:
    print("Error loading class names:", e)
    class_names = {}


# ----------------- Helpers -----------------
def save_prediction(filename: str, prediction: str, confidence: float):
    record = {
        "image_name": filename,
        "prediction": prediction,
        "confidence": confidence,
        "date": local_store.now_iso(),
    }
    prediction_collection = database.get_prediction_collection()
    if prediction_collection is None:
        local_store.create_item(local_store.PREDICTIONS_FILE, record)
        return
    prediction_collection.insert_one(record)


def save_plant(name: str, disease: str, confidence: float):
    record = {
        "plant_name": name,
        "disease": disease,
        "confidence": confidence,
        "date": local_store.now_iso(),
        "tracking": True,
    }
    plants_collection = database.get_plants_collection()
    if plants_collection is None:
        local_store.create_item(local_store.PLANTS_FILE, record)
        return
    plants_collection.insert_one(record)


def predict_image(file_bytes: bytes):
    if model is None:
        raise HTTPException(status_code=500, detail="AI model not loaded")
    if image is None:
        raise HTTPException(status_code=500, detail="Image preprocessing is unavailable")
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize((224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    prediction = model.predict(img_array)
    class_index = int(np.argmax(prediction))
    confidence = float(np.max(prediction))
    top_indices = np.argsort(prediction[0])[::-1][:3]
    top_predictions = [
        {
            "label": normalize_prediction_label(class_names.get(int(index), "Unknown")),
            "confidence": float(prediction[0][int(index)]),
        }
        for index in top_indices
    ]

    predicted_label = normalize_prediction_label(class_names.get(class_index, "Unknown"))
    if confidence < MIN_CONFIDENCE_THRESHOLD:
        return "Needs closer inspection", confidence, top_predictions

    return predicted_label, confidence, top_predictions


def get_tracked_plant_records():
    plants_collection = database.get_plants_collection()
    records = (
        local_store.list_items(local_store.PLANTS_FILE)
        if plants_collection is None
        else list(plants_collection.find())
    )
    return [record for record in records if record.get("tracking", True) is not False]


def get_season_for_month(month: int):
    if month in (12, 1, 2):
        return "winter"
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    return "autumn"


def build_quick_tips():
    now = datetime.now()
    records = get_tracked_plant_records()
    plant_names = [record.get("name") or record.get("plant_name") for record in records if record.get("name") or record.get("plant_name")]
    plant_count = len(plant_names)
    warning_count = sum(1 for record in records if record.get("confidence", 1) < 0.8)
    featured_plant = plant_names[0] if plant_names else None
    hour = now.hour
    season = get_season_for_month(now.month)

    if hour < 10:
        timing_tip = {
            "id": "morning-check",
            "category": "Daily Rhythm",
            "title": "Use the morning for a fast leaf check",
            "tip": "Look for drooping leaves, dry soil, or pests before the day gets hotter.",
            "detail": "A quick morning check helps you spot stress early and water only the plants that need it.",
        }
    elif hour < 16:
        timing_tip = {
            "id": "midday-light",
            "category": "Daily Rhythm",
            "title": "Watch midday light exposure",
            "tip": "Bright windows can become too intense around noon.",
            "detail": "If leaves feel hot or start fading, move sensitive plants slightly back from direct light.",
        }
    else:
        timing_tip = {
            "id": "evening-reset",
            "category": "Daily Rhythm",
            "title": "Use the evening to reset care tasks",
            "tip": "Review which plants were watered today and which can wait until tomorrow.",
            "detail": "A simple evening reset prevents accidental overwatering and keeps care more consistent.",
        }

    season_tip_map = {
        "winter": {
            "id": "season-winter",
            "category": "Seasonal Care",
            "title": "Winter care should stay light",
            "tip": "Most plants need less water and slower feeding during cooler months.",
            "detail": "Let the top layer of soil dry a little longer before watering, especially for indoor plants.",
        },
        "spring": {
            "id": "season-spring",
            "category": "Seasonal Care",
            "title": "Spring is a growth restart window",
            "tip": "This is a good time to prune lightly and restart a feeding routine.",
            "detail": "New growth usually responds well to brighter light, gentle fertilizer, and fresh inspection.",
        },
        "summer": {
            "id": "season-summer",
            "category": "Seasonal Care",
            "title": "Summer means faster drying soil",
            "tip": "Check moisture more often instead of watering on a rigid schedule.",
            "detail": "Heat and light can change the pace quickly, especially in smaller pots and balcony setups.",
        },
        "autumn": {
            "id": "season-autumn",
            "category": "Seasonal Care",
            "title": "Autumn is a transition season",
            "tip": "Slow down fertilizer and watch how indoor light shifts through the day.",
            "detail": "Plants often need a softer care rhythm as temperatures and daylight begin to drop.",
        },
    }

    if plant_count == 0:
        collection_tip = {
            "id": "collection-start",
            "category": "Getting Started",
            "title": "Add your first plant to unlock more useful tips",
            "tip": "Quick Tips become more personal once Florana can see what you are tracking.",
            "detail": "Registering a plant lets the app surface more relevant reminders and care patterns.",
        }
    elif warning_count > 0:
        collection_tip = {
            "id": "collection-warning",
            "category": "Plant Health",
            "title": f"{warning_count} tracked plant{'s' if warning_count != 1 else ''} may need attention",
            "tip": "Open My Plants and review the entries marked with lower confidence or warning signals.",
            "detail": "Plants with uncertain health data are worth checking first so small issues do not spread.",
        }
    else:
        featured_label = featured_plant or "your collection"
        collection_tip = {
            "id": "collection-healthy",
            "category": "Collection Focus",
            "title": f"Your collection is looking steady",
            "tip": f"Keep care consistent for {featured_label} and the rest of your tracked plants.",
            "detail": "Consistency is usually more helpful than doing too much at once, especially with watering and light changes.",
        }

    if featured_plant:
        personal_tip = {
            "id": "plant-feature",
            "category": "Plant Spotlight",
            "title": f"Focus on {featured_plant} today",
            "tip": f"Check the leaves and soil around {featured_plant} before making any big changes.",
            "detail": "A simple touch-and-look routine often tells you more than following a fixed schedule alone.",
        }
    else:
        personal_tip = {
            "id": "plant-feature-generic",
            "category": "Care Habit",
            "title": "Build a repeatable plant routine",
            "tip": "Use one small habit like checking soil moisture at the same time each day.",
            "detail": "Reliable observation usually improves plant care faster than collecting more tools.",
        }

    tips = [timing_tip, season_tip_map[season], collection_tip, personal_tip]
    return {
        "generated_at": now.isoformat(),
        "context": {
            "season": season,
            "hour": hour,
            "plant_count": plant_count,
            "warning_count": warning_count,
            "featured_plant": featured_plant,
        },
        "tips": tips,
    }


# ----------------- AI ROUTES -----------------
@app.post("/predict")
async def predict(file: UploadFile | None = File(None)):
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Image file is required")
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Invalid image format")
    file_bytes = await file.read()
    prediction, confidence, top_predictions = predict_image(file_bytes)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = build_upload_disk_path(filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    save_prediction(filename, prediction, confidence)
    save_plant(filename, prediction, confidence)
    return {
        "status": "success",
        "prediction": prediction,
        "confidence": confidence,
        "top_predictions": top_predictions,
        "image_url": build_upload_api_path(filename),
    }


# ----------------- HISTORY -----------------
@app.get("/history")
def get_history():
    prediction_collection = database.get_prediction_collection()
    if prediction_collection is None:
        records = local_store.list_items(local_store.PREDICTIONS_FILE)
    else:
        records = list(prediction_collection.find({}, {"_id": 0}))
    return {"status": "success", "data": records}


# ----------------- PLANTS -----------------
@app.get("/plants")
def get_all_plants():
    plants_collection = database.get_plants_collection()
    records = (
        local_store.list_items(local_store.PLANTS_FILE)
        if plants_collection is None
        else list(plants_collection.find())
    )
    plants = []
    for p in records:
        plants.append(
            {
                "id": str(p.get("_id", "")),
                "name": p.get("name") or p.get("plant_name", "Unknown"),
                "info": p.get("disease", ""),
                "badges": [p.get("disease")] if p.get("disease") else [],
                "warning": True if p.get("confidence", 0) < 0.8 else False,
                "image_path": p.get("image_path") or (build_upload_public_path(p.get("plant_name")) if p.get("plant_name") else None),
                "tracking": p.get("tracking", True),
            }
        )
    return plants


@app.get("/quick-tips")
def get_quick_tips():
    return build_quick_tips()


@app.delete("/plants/{plant_id}")
def delete_plant(plant_id: str):
    try:
        plants_collection = database.get_plants_collection()
        if plants_collection is None:
            deleted_count = local_store.delete_item(
                local_store.PLANTS_FILE,
                lambda item: item.get("_id") == plant_id,
            )
        else:
            result = plants_collection.delete_one({"_id": ObjectId(plant_id)})
            deleted_count = result.deleted_count

        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Plant not found")
        return {"message": "Plant deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----------------- CARE REMINDER -----------------
scheduler = BackgroundScheduler()
scheduler.start()
care_reminders = []


def send_care_notification(token: str, task: str):
    if messaging is None:
        print("Notification skipped: Firebase messaging is unavailable")
        return
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title="Plant Care Reminder",
                body=f"Time to {task} your plant!",
            ),
            token=token,
        )
        messaging.send(message)
        print(f"Notification sent. Task: {task}")
    except Exception as e:
        print("Notification error:", e)


def schedule_care(reminder: dict):
    hour, minute = map(int, reminder["time"].split(":"))
    task = reminder.get("task", "water")
    scheduler.add_job(
        send_care_notification,
        "cron",
        hour=hour,
        minute=minute,
        args=[reminder["token"], task],
        id=f"{reminder['token']}_{task}",
        replace_existing=True,
    )


@app.post("/care-reminder")
async def set_care_reminder(data: dict):
    time = data.get("time")
    token = data.get("token")
    task = data.get("task", "water")
    if not time or not token:
        raise HTTPException(status_code=400, detail="Missing time or token")
    reminder = {"time": time, "token": token, "task": task}
    care_reminders.append(reminder)
    schedule_care(reminder)
    return {"message": "Care reminder set successfully"}
