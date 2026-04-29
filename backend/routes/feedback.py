from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=0, le=5)
    message: str = Field(min_length=1, max_length=2000)


@router.get("/")
def get_feedback():
    feedback_collection = database.get_feedback_collection()
    records = (
        local_store.list_items(local_store.FEEDBACK_FILE)
        if feedback_collection is None
        else list(feedback_collection.find().sort("createdAt", -1))
    )

    feedbacks = []
    for record in records:
        feedbacks.append(
            {
                "id": str(record.get("_id", "")),
                "rating": int(record.get("rating", 0)),
                "message": record.get("message", ""),
                "createdAt": record.get("createdAt") or record.get("created_at") or local_store.now_iso(),
            }
        )

    feedbacks.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
    return feedbacks


@router.post("/")
def create_feedback(payload: FeedbackCreate):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty")

    record = {
        "rating": payload.rating,
        "message": message,
        "createdAt": local_store.now_iso(),
    }

    feedback_collection = database.get_feedback_collection()
    if feedback_collection is None:
        stored = local_store.create_item(local_store.FEEDBACK_FILE, record)
        record_id = stored["_id"]
    else:
        result = feedback_collection.insert_one(record)
        record_id = str(result.inserted_id)

    return {
        "id": record_id,
        "rating": payload.rating,
        "message": message,
        "createdAt": record["createdAt"],
    }


@router.delete("/")
def clear_feedback():
    feedback_collection = database.get_feedback_collection()
    if feedback_collection is None:
        local_store._write_json(local_store.FEEDBACK_FILE, [])
    else:
        feedback_collection.delete_many({})
    return {"message": "Feedback cleared successfully"}
