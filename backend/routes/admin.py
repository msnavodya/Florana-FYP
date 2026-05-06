from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

try:
    from .. import database
    from ..routes.shop import serialize_product
    from ..utils import auth_store, local_store
    from ..utils.jwt_auth import admin_required
except ImportError:
    import database
    from routes.shop import serialize_product
    from utils import auth_store, local_store
    from utils.jwt_auth import admin_required


router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(admin_required)])


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user.get("_id") or user.get("id") or ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
    }


def serialize_plant(plant: dict) -> dict:
    return {
        "id": str(plant.get("_id") or plant.get("id") or ""),
        "name": plant.get("name") or plant.get("plant_name") or "Unknown",
        "location": plant.get("location") or plant.get("disease") or "",
        "user": plant.get("user_email") or plant.get("user") or plant.get("owner") or "Unknown",
    }


@router.get("/users")
def get_admin_users():
    users_collection = database.get_users_collection()
    records = auth_store.list_users() if users_collection is None else list(users_collection.find())
    return [serialize_user(user) for user in records]


@router.get("/plants")
def get_admin_plants():
    plants_collection = database.get_plants_collection()
    records = local_store.list_items(local_store.PLANTS_FILE) if plants_collection is None else list(plants_collection.find())
    return [serialize_plant(plant) for plant in records]


@router.get("/products")
def get_admin_products():
    products_collection = database.get_products_collection()
    records = local_store.list_items(local_store.PRODUCTS_FILE) if products_collection is None else list(products_collection.find())
    records.sort(key=lambda product: product.get("created_at") or "", reverse=True)
    return [serialize_product(product) for product in records]


@router.delete("/plants/{plant_id}")
def delete_admin_plant(plant_id: str):
    plants_collection = database.get_plants_collection()
    if plants_collection is None:
        deleted_count = local_store.delete_item(
            local_store.PLANTS_FILE,
            lambda item: item.get("_id") == plant_id or item.get("id") == plant_id,
        )
    else:
        if not ObjectId.is_valid(plant_id):
            raise HTTPException(status_code=400, detail="Invalid plant ID")
        deleted_count = plants_collection.delete_one({"_id": ObjectId(plant_id)}).deleted_count

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant deleted successfully"}


@router.delete("/products/{product_id}")
def delete_admin_product(product_id: str):
    products_collection = database.get_products_collection()
    if products_collection is None:
        deleted_count = local_store.delete_item(
            local_store.PRODUCTS_FILE,
            lambda item: item.get("_id") == product_id or item.get("id") == product_id,
        )
    else:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=400, detail="Invalid product ID")
        deleted_count = products_collection.delete_one({"_id": ObjectId(product_id)}).deleted_count

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
