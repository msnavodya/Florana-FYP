# routes/plant.py
from datetime import datetime
import os
import shutil
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/plants/")
async def create_plant(
    name: str = Form(...),
    species: Optional[str] = Form(None),
    flowerId: Optional[str] = Form(None),
    flowerCatalog: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    specificLocation: Optional[str] = Form(None),
    climate: Optional[str] = Form(None),
    sunlight: Optional[str] = Form(None),
    soilType: Optional[str] = Form(None),
    wateringFrequency: Optional[str] = Form(None),
    fertilizerSchedule: Optional[str] = Form(None),
    lastWatered: Optional[str] = Form(None),
    initialSize: Optional[str] = Form(None),
    tracking: Optional[str] = Form("true"),
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

        plant = {
            "name": name,
            "species": species,
            "flowerId": flowerId,
            "flowerCatalog": flowerCatalog,
            "location": location,
            "specificLocation": specificLocation,
            "climate": climate,
            "sunlight": sunlight,
            "soilType": soilType,
            "wateringFrequency": wateringFrequency,
            "fertilizerSchedule": fertilizerSchedule,
            "lastWatered": lastWatered,
            "initialSize": initialSize,
            "tracking": str(tracking).lower() == "true",
            "image_path": image_path,
            "created_at": local_store.now_iso(),
        }

        plants_collection = database.get_plants_collection()
        if plants_collection is None:
            return local_store.create_item(local_store.PLANTS_FILE, plant)

        result = plants_collection.insert_one(plant)
        plant["_id"] = str(result.inserted_id)
        return plant
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plants/")
def get_all_plants():
    plants_collection = database.get_plants_collection()
    plants = local_store.list_items(local_store.PLANTS_FILE) if plants_collection is None else list(plants_collection.find({}))
    for plant in plants:
        if "_id" in plant:
            plant["_id"] = str(plant["_id"])
    return plants


@router.get("/plants/by-name/{name}")
def get_plant_by_name(name: str):
    plants_collection = database.get_plants_collection()
    if plants_collection is None:
        plant = local_store.find_item(local_store.PLANTS_FILE, lambda item: item.get("name") == name)
    else:
        plant = plants_collection.find_one({"name": name})

    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant["_id"] = str(plant["_id"])
    return plant
