# Define backend API routes for Shop features.
import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from .. import database
    from ..utils import local_store
    from ..utils.paths import build_upload_disk_path, build_upload_public_path, resolve_uploaded_file_path
except ImportError:
    import database
    from utils import local_store
    from utils.paths import build_upload_disk_path, build_upload_public_path, resolve_uploaded_file_path


router = APIRouter(prefix="/shop", tags=["Shop"])

ALLOWED_SEASONS = {"spring": "Spring", "summer": "Summer", "autumn": "Autumn", "winter": "Winter"}
ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp"}


def serialize_product(product: dict) -> dict:
    product_id = str(product.get("_id") or product.get("id") or "")
    return {
        "id": product_id,
        "name": product.get("name", ""),
        "price": float(product.get("price", 0) or 0),
        "season": product.get("season", "Spring"),
        "image": product.get("image"),
        "stock": int(product.get("stock", 10) or 0),
        "created_at": product.get("created_at"),
    }


def normalize_season(value: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized not in ALLOWED_SEASONS:
        raise HTTPException(status_code=400, detail="Choose a valid season: Spring, Summer, Autumn, or Winter")
    return ALLOWED_SEASONS[normalized]


def build_safe_upload_name(file: UploadFile) -> str:
    content_type = (file.content_type or "").lower()
    extension = ALLOWED_IMAGE_TYPES.get(content_type)

    if not extension:
        suffix = Path(file.filename or "").suffix.lower().lstrip(".")
        if suffix in {"jpg", "jpeg", "png", "webp"}:
            extension = "jpg" if suffix == "jpeg" else suffix

    if not extension:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, or WEBP image")

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{timestamp}_{uuid4().hex}.{extension}"


def find_product(products_collection, product_id: str):
    if products_collection is None:
        return local_store.find_item(
            local_store.PRODUCTS_FILE,
            lambda item: item.get("_id") == product_id or item.get("id") == product_id,
        )

    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")

    return products_collection.find_one({"_id": ObjectId(product_id)})


@router.get("/products")
def get_products():
    products_collection = database.get_products_collection()
    records = local_store.list_items(local_store.PRODUCTS_FILE) if products_collection is None else list(products_collection.find())
    records.sort(key=lambda product: product.get("created_at") or "", reverse=True)
    return [serialize_product(product) for product in records]


@router.post("/products")
async def add_product(
    name: str = Form(...),
    price: float = Form(...),
    season: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        clean_name = name.strip()
        if len(clean_name) < 2:
            raise HTTPException(status_code=400, detail="Plant name must be at least 2 characters")

        if price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")

        clean_season = normalize_season(season)
        filename = build_safe_upload_name(file)
        products_collection = database.get_products_collection()
        filepath = build_upload_disk_path(filename)
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Choose a plant image before saving")

        with open(filepath, "wb") as file_handle:
            file_handle.write(file_bytes)

        product = {
            "name": clean_name,
            "price": float(price),
            "season": clean_season,
            "image": build_upload_public_path(filename),
            "stock": 10,
            "created_at": local_store.now_iso(),
        }

        if products_collection is None:
            stored = local_store.create_item(local_store.PRODUCTS_FILE, product)
            product_id = stored["_id"]
        else:
            result = products_collection.insert_one(product)
            product_id = str(result.inserted_id)

        product["_id"] = product_id
        product["id"] = product_id
        return serialize_product(product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}")
def delete_product(product_id: str):
    try:
        products_collection = database.get_products_collection()
        product = find_product(products_collection, product_id)

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        image_path = product.get("image")
        resolved_image_path = resolve_uploaded_file_path(image_path)
        if resolved_image_path and resolved_image_path.exists():
            os.remove(resolved_image_path)

        if products_collection is None:
            local_store.delete_item(
                local_store.PRODUCTS_FILE,
                lambda item: item.get("_id") == product_id or item.get("id") == product_id,
            )
        else:
            products_collection.delete_one({"_id": ObjectId(product_id)})

        return {"message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
