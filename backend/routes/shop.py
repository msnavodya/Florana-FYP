import os
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter(prefix="/shop", tags=["Shop"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/products")
def get_products():
    products_collection = database.get_products_collection()
    records = local_store.list_items(local_store.PRODUCTS_FILE) if products_collection is None else list(products_collection.find())

    products = []
    for product in records:
        products.append(
            {
                "id": str(product.get("_id", "")),
                "name": product.get("name", ""),
                "price": product.get("price", 0),
                "season": product.get("season", "Spring"),
                "image": product.get("image"),
                "stock": product.get("stock", 10),
            }
        )

    return products


@router.post("/products")
async def add_product(
    name: str = Form(...),
    price: float = Form(...),
    season: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        products_collection = database.get_products_collection()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as file_handle:
            file_handle.write(await file.read())

        product = {
            "name": name,
            "price": price,
            "season": season,
            "image": f"uploads/{filename}".replace("\\", "/"),
            "stock": 10,
            "created_at": local_store.now_iso(),
        }

        if products_collection is None:
            stored = local_store.create_item(local_store.PRODUCTS_FILE, product)
            product_id = stored["_id"]
        else:
            result = products_collection.insert_one(product)
            product_id = str(result.inserted_id)

        return {
            "message": "Product added successfully",
            "id": product_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}")
def delete_product(product_id: str):
    try:
        products_collection = database.get_products_collection()
        if products_collection is None:
            product = local_store.find_item(local_store.PRODUCTS_FILE, lambda item: item.get("_id") == product_id)
        else:
            product = products_collection.find_one({"_id": ObjectId(product_id)})

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        image_path = product.get("image")
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        if products_collection is None:
            local_store.delete_item(local_store.PRODUCTS_FILE, lambda item: item.get("_id") == product_id)
        else:
            products_collection.delete_one({"_id": ObjectId(product_id)})

        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
