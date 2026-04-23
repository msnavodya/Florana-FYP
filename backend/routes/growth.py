import os
import shutil

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from datetime import datetime

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter(prefix="/growth", tags=["Growth"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def add_growth(
    plant_id: str = Form(...),
    height: str = Form(...),
    health: str = Form(...),
    notes: str = Form(None),
    image: UploadFile = File(None),
):
    try:
        image_path = None

        if image:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_{image.filename}"
            file_path = os.path.join(UPLOAD_DIR, filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            image_path = file_path.replace("\\", "/")

        record = {
            "plant_id": plant_id,
            "height": height,
            "health": health,
            "notes": notes,
            "image_path": image_path,
            "date": local_store.now_iso(),
        }

        growth_collection = database.get_growth_collection()
        if growth_collection is None:
            record = local_store.create_item(local_store.GROWTH_FILE, record)
        else:
            result = growth_collection.insert_one(record)
            record["_id"] = str(result.inserted_id)

        return {"status": "success", "data": record}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plant_id}")
def get_growth(plant_id: str):
    try:
        growth_collection = database.get_growth_collection()
        records = (
            local_store.filter_items(local_store.GROWTH_FILE, lambda item: item.get("plant_id") == plant_id)
            if growth_collection is None
            else list(growth_collection.find({"plant_id": plant_id}))
        )

        for record in records:
            if "_id" in record:
                record["_id"] = str(record["_id"])

        return {"status": "success", "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
