# Define backend API routes for Plant features.
from datetime import datetime
import os
import shutil
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from bson import ObjectId

try:
    from .. import database
    from ..utils import local_store
    from ..utils.paths import build_upload_disk_path, build_upload_public_path, resolve_uploaded_file_path
except ImportError:
    import database
    from utils import local_store
    from utils.paths import build_upload_disk_path, build_upload_public_path, resolve_uploaded_file_path


router = APIRouter()


def serialize_plant(plant: dict) -> dict:
    if "_id" in plant:
        plant["_id"] = str(plant["_id"])
    if "id" not in plant and plant.get("_id"):
        plant["id"] = str(plant["_id"])
    return plant


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
            file_path = build_upload_disk_path(filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_path = build_upload_public_path(filename)

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
            "health": "Stable",
            "warning": False,
            "badges": [item for item in [species, flowerCatalog, sunlight] if item],
            "created_at": local_store.now_iso(),
            "updated_at": local_store.now_iso(),
        }

        plants_collection = database.get_plants_collection()
        if plants_collection is None:
            return local_store.create_item(local_store.PLANTS_FILE, plant)

        result = plants_collection.insert_one(plant)
        plant["_id"] = str(result.inserted_id)
        plant["id"] = str(result.inserted_id)
        return plant
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plants/")
def get_all_plants():
    plants_collection = database.get_plants_collection()
    plants = local_store.list_items(local_store.PLANTS_FILE) if plants_collection is None else list(plants_collection.find({}))
    return [serialize_plant(plant) for plant in plants]


@router.get("/plants/by-name/{name}")
def get_plant_by_name(name: str):
    plants_collection = database.get_plants_collection()
    if plants_collection is None:
        plant = local_store.find_item(local_store.PLANTS_FILE, lambda item: item.get("name") == name or item.get("_id") == name or item.get("id") == name)
    else:
        query_options = [{"name": name}, {"flowerId": name}]
        if ObjectId.is_valid(name):
            query_options.append({"_id": ObjectId(name)})
        plant = plants_collection.find_one({"$or": query_options})

    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    return serialize_plant(plant)


@router.delete("/plants/{plant_id}")
def delete_plant(plant_id: str):
    try:
        plants_collection = database.get_plants_collection()

        if plants_collection is None:
            plant = local_store.find_item(
                local_store.PLANTS_FILE,
                lambda item: item.get("_id") == plant_id or item.get("id") == plant_id,
            )
        else:
            if not ObjectId.is_valid(plant_id):
                raise HTTPException(status_code=400, detail="Invalid plant ID")
            plant = plants_collection.find_one({"_id": ObjectId(plant_id)})

        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        image_path = plant.get("image_path")
        resolved_image_path = resolve_uploaded_file_path(image_path)
        if resolved_image_path and resolved_image_path.exists():
            os.remove(resolved_image_path)

        if plants_collection is None:
            local_store.delete_item(
                local_store.PLANTS_FILE,
                lambda item: item.get("_id") == plant_id or item.get("id") == plant_id,
            )
        else:
            plants_collection.delete_one({"_id": ObjectId(plant_id)})

        return {"message": "Plant deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
