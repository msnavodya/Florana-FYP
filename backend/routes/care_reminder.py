# Define backend API routes for Care Reminder features.
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter(prefix="/care-reminders", tags=["CareReminder"])
REMINDER_DOCUMENT_ID = "global"

DEFAULT_REMINDER_STATE = {
    "options": {
        "watering": True,
        "fertilizing": False,
        "pruning": False,
        "repotting": False,
        "sunlight": True,
    },
    "customNotes": [],
    "summaryMode": "daily",
    "notifications": {
        "push": True,
        "email": False,
    },
    "wateringTime": "07:00",
    "inAppMessages": [],
}


class ReminderMessage(BaseModel):
    id: int
    text: str = Field(min_length=1, max_length=500)


class ReminderPayload(BaseModel):
    options: dict[str, bool]
    customNotes: list[str]
    summaryMode: str
    notifications: dict[str, bool]
    wateringTime: str
    inAppMessages: list[ReminderMessage] = Field(default_factory=list)


def normalize_reminders(payload: dict[str, Any] | None):
    record = payload or {}

    options = DEFAULT_REMINDER_STATE["options"].copy()
    options.update(
        {
            key: bool(value)
            for key, value in (record.get("options") or {}).items()
            if key in DEFAULT_REMINDER_STATE["options"]
        }
    )

    notifications = DEFAULT_REMINDER_STATE["notifications"].copy()
    notifications.update(
        {
            key: bool(value)
            for key, value in (record.get("notifications") or {}).items()
            if key in DEFAULT_REMINDER_STATE["notifications"]
        }
    )

    summary_mode = record.get("summaryMode")
    if summary_mode not in {"daily", "weekly"}:
        summary_mode = DEFAULT_REMINDER_STATE["summaryMode"]

    watering_time = str(record.get("wateringTime") or DEFAULT_REMINDER_STATE["wateringTime"]).strip()

    custom_notes = [
        str(note).strip()
        for note in (record.get("customNotes") or [])
        if str(note).strip()
    ][:8]

    in_app_messages = []
    for entry in (record.get("inAppMessages") or [])[:6]:
        if not isinstance(entry, dict):
            continue

        text = str(entry.get("text") or "").strip()
        if not text:
            continue

        raw_id = entry.get("id")
        try:
            message_id = int(raw_id)
        except (TypeError, ValueError):
            message_id = int(local_store.now_iso().replace("-", "").replace(":", "").replace(".", "")[:18] or 0)

        in_app_messages.append({"id": message_id, "text": text})

    return {
        "options": options,
        "customNotes": custom_notes,
        "summaryMode": summary_mode,
        "notifications": notifications,
        "wateringTime": watering_time,
        "inAppMessages": in_app_messages,
    }


def read_local_reminders():
    records = local_store.list_items(local_store.CARE_REMINDERS_FILE)
    if not records:
        return DEFAULT_REMINDER_STATE.copy()
    return normalize_reminders(records[0] if isinstance(records[0], dict) else None)


def write_local_reminders(reminders: dict[str, Any]):
    local_store._write_json(local_store.CARE_REMINDERS_FILE, [reminders])


@router.get("/")
def get_reminders():
    care_collection = database.get_care_reminders_collection()
    if care_collection is None:
        return read_local_reminders()

    record = care_collection.find_one({"_id": REMINDER_DOCUMENT_ID}, {"_id": 0})
    return normalize_reminders(record)


@router.put("/")
def save_reminders(payload: ReminderPayload):
    reminders = normalize_reminders(payload.model_dump())
    care_collection = database.get_care_reminders_collection()

    if care_collection is None:
        write_local_reminders(reminders)
    else:
        care_collection.replace_one(
            {"_id": REMINDER_DOCUMENT_ID},
            {"_id": REMINDER_DOCUMENT_ID, **reminders},
            upsert=True,
        )

    return reminders
