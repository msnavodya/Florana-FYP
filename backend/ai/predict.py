# Run plant disease model inference for uploaded images.
# Florana AI Prediction Module
# File: backend/ai/predict.py
# =============================================

import os
import io
import json
import numpy as np
from PIL import Image
from datetime import datetime

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# MongoDB
from pymongo import MongoClient

# =============================================
# MONGODB CONNECTION
# =============================================
client = MongoClient("mongodb://localhost:27017/")
db = client["florana_db"]

prediction_collection = db["prediction_history"]

# =============================================
# PATHS
# =============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "plant_disease_model.keras")
CLASS_PATH = os.path.join(BASE_DIR, "class_names.json")

# =============================================
# LOAD MODEL
# =============================================
try:
    model = load_model(MODEL_PATH)
    print("✅ AI model loaded successfully from", MODEL_PATH)
except Exception as e:
    print(f"❌ Error loading AI model: {e}")
    model = None

# =============================================
# LOAD CLASS NAMES
# =============================================
try:
    with open(CLASS_PATH, "r") as f:
        class_data = json.load(f)

    if isinstance(class_data, dict):
        class_names = {str(k): v for k, v in class_data.items()}
    else:
        class_names = {str(i): name for i, name in enumerate(class_data)}

    print("✅ Class names loaded:", list(class_names.values()))

except Exception as e:
    print("❌ Error loading class names:", e)
    class_names = {}

# =============================================
# IMAGE PREPROCESSING
# =============================================
def preprocess_image(file_bytes):
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize((224, 224))

    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0

    return img_array

# =============================================
# SAVE TO MONGODB
# =============================================
def save_prediction(filename, disease, confidence):
    data = {
        "image_name": filename,
        "disease": disease,
        "confidence": confidence,
        "date": datetime.utcnow()
    }

    prediction_collection.insert_one(data)
    print("✅ Prediction saved to MongoDB")

# =============================================
# PREDICTION FUNCTION
# =============================================
def predict_image(file_bytes, filename="unknown"):

    if model is None:
        raise Exception("AI model not loaded")

    try:
        img_array = preprocess_image(file_bytes)

        predictions = model.predict(img_array)

        class_index = str(int(np.argmax(predictions)))
        confidence = float(np.max(predictions))

        disease_name = class_names.get(class_index, "Unknown")

        # Convert healthy label
        if disease_name.lower() in ["fresh leaf", "healthy"]:
            disease_name = "Healthy Plant 🌿"

        # Round confidence
        confidence_percent = round(confidence * 100, 2)

        # SAVE TO DB
        save_prediction(filename, disease_name, confidence_percent)

        # FINAL RESPONSE
        return {
            "disease": disease_name,
            "confidence": confidence_percent
        }

    except Exception as e:
        raise Exception(f"Prediction error: {str(e)}")
