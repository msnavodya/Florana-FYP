# Initialize database access and fallback persistence used by the backend.
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
import os
from sqlalchemy.orm import declarative_base

# =============================
# MongoDB Connection
# =============================
# Use environment variable if available, fallback to localhost
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = None
db = None
connection_status = "disconnected"

users_collection = None
plants_collection = None
products_collection = None
prediction_collection = None
growth_collection = None
login_history_collection = None
feedback_collection = None
care_reminders_collection = None
Base = declarative_base()


def _set_collections(current_db):
    """Refresh exported collection handles after connection changes."""
    global users_collection, plants_collection, products_collection
    global prediction_collection, growth_collection, login_history_collection, feedback_collection
    global care_reminders_collection

    if current_db is None:
        users_collection = None
        plants_collection = None
        products_collection = None
        prediction_collection = None
        growth_collection = None
        login_history_collection = None
        feedback_collection = None
        care_reminders_collection = None
        return

    users_collection = current_db["users"]
    plants_collection = current_db["plants"]
    products_collection = current_db["products"]
    prediction_collection = current_db["prediction_history"]
    growth_collection = current_db["growth"]
    login_history_collection = current_db["login_history"]
    feedback_collection = current_db["feedback"]
    care_reminders_collection = current_db["care_reminders"]


def connect_to_mongo():
    """Attempt to connect to MongoDB and refresh shared collection handles."""
    global client, db, connection_status

    try:
        client = MongoClient(
            MONGO_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        client.admin.command("ping")
        db = client["florana_db"]
        _set_collections(db)
        connection_status = "connected"
        print("MongoDB connected successfully")
        return True
    except ServerSelectionTimeoutError:
        client = None
        db = None
        _set_collections(None)
        connection_status = "disconnected"
        print("MongoDB connection failed: Connection timeout")
        print("Please start MongoDB:")
        print("   Windows: net start MongoDB or mongod")
        print("   macOS: brew services start mongodb-community")
        print("   Linux: sudo systemctl start mongod")
        return False
    except Exception as e:
        client = None
        db = None
        _set_collections(None)
        connection_status = "disconnected"
        print(f"MongoDB connection failed: {str(e)}")
        print("Please start MongoDB or set MONGO_URL environment variable")
        return False


def ensure_db_connection():
    """Reconnect on demand so routes can recover without restarting the API."""
    global client, connection_status

    if client is not None:
        try:
            client.admin.command("ping")
            connection_status = "connected"
            return True
        except PyMongoError:
            client = None

    return connect_to_mongo()


def get_users_collection():
    ensure_db_connection()
    return users_collection


def get_plants_collection():
    ensure_db_connection()
    return plants_collection


def get_products_collection():
    ensure_db_connection()
    return products_collection


def get_prediction_collection():
    ensure_db_connection()
    return prediction_collection


def get_growth_collection():
    ensure_db_connection()
    return growth_collection


def get_login_history_collection():
    ensure_db_connection()
    return login_history_collection


def get_feedback_collection():
    ensure_db_connection()
    return feedback_collection


def get_care_reminders_collection():
    ensure_db_connection()
    return care_reminders_collection


connect_to_mongo()

# =============================
# Helper / Health Check
# =============================
def check_db_connection():
    """
    Ping MongoDB server to verify connection.
    Returns a dict with status and message.
    """
    if not ensure_db_connection():
        return {"status": "error", "message": "MongoDB client not initialized"}

    try:
        client.admin.command("ping")
        return {"status": "success", "message": "MongoDB is online"}
    except Exception as e:
        return {"status": "error", "message": f"MongoDB connection failed: {str(e)}"}
