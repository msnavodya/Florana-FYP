from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

try:
    from .. import database
    from ..routes.feedback import get_feedback
    from ..routes.payment import ORDERS_FILE
    from ..routes.shop import serialize_product
    from ..utils import auth_store, local_store
    from ..utils.jwt_auth import admin_required
except ImportError:
    import database
    from routes.feedback import get_feedback
    from routes.payment import ORDERS_FILE
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
        "health": plant.get("health") or plant.get("disease") or "Stable",
        "created_at": plant.get("created_at") or plant.get("date") or "",
    }


def serialize_payment(order: dict) -> dict:
    delivery = order.get("delivery") or {}
    items = order.get("items") or []
    order_id = str(order.get("_id") or order.get("id") or "")
    return {
        "id": order_id,
        "customer": delivery.get("name") or order.get("customer") or "Unknown",
        "phone": delivery.get("phone") or "",
        "email": delivery.get("email") or "",
        "address": delivery.get("address") or "",
        "note": delivery.get("note") or "",
        "method": order.get("method") or "manual",
        "amount": float(order.get("amount") or 0),
        "currency": order.get("currency") or "LKR",
        "status": order.get("status") or "pending",
        "item_count": int(order.get("item_count") or len(items)),
        "items": items,
        "items_summary": ", ".join(
            f"{item.get('name', 'Item')} x{item.get('quantity', 1)}"
            for item in items
            if isinstance(item, dict)
        ),
        "payment_intent_id": order.get("payment_intent_id") or "",
        "created_at": order.get("created_at") or "",
    }


def list_orders() -> list[dict]:
    database.ensure_db_connection()
    if getattr(database, "db", None) is None:
        records = local_store.list_items(ORDERS_FILE)
    else:
        records = list(database.db["orders"].find())

    records.sort(key=lambda order: order.get("created_at") or "", reverse=True)
    return [serialize_payment(order) for order in records]


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


@router.get("/feedback")
def get_admin_feedback():
    return get_feedback()


@router.get("/payments")
def get_admin_payments():
    return list_orders()


@router.delete("/payments/{payment_id}")
def delete_admin_payment(payment_id: str):
    database.ensure_db_connection()
    if getattr(database, "db", None) is None:
        deleted_count = local_store.delete_item(
            ORDERS_FILE,
            lambda item: item.get("_id") == payment_id or item.get("id") == payment_id,
        )
    else:
        if not ObjectId.is_valid(payment_id):
            raise HTTPException(status_code=400, detail="Invalid payment ID")
        deleted_count = database.db["orders"].delete_one({"_id": ObjectId(payment_id)}).deleted_count

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return {"message": "Payment record deleted successfully"}


@router.get("/summary")
def get_admin_summary():
    users = get_admin_users()
    plants = get_admin_plants()
    products = get_admin_products()
    feedback = get_admin_feedback()
    payments = get_admin_payments()
    revenue = sum(payment["amount"] for payment in payments if payment["status"] in {"succeeded", "cod_confirmed"})

    return {
        "counts": {
            "users": len(users),
            "plants": len(plants),
            "products": len(products),
            "feedback": len(feedback),
            "payments": len(payments),
        },
        "revenue": revenue,
        "recent_feedback": feedback[:5],
        "recent_payments": payments[:5],
    }


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
