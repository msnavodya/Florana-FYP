# Read and write payment records used by the backend checkout flow.
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "data"
ORDERS_FILE = DATA_DIR / "payment_orders.json"
_LOCK = Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_store() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not ORDERS_FILE.exists():
        ORDERS_FILE.write_text("[]", encoding="utf-8")


def _read_orders() -> list[dict[str, Any]]:
    _ensure_store()
    with ORDERS_FILE.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if not isinstance(raw, list):
        return []
    return [item for item in raw if isinstance(item, dict)]


def _write_orders(orders: list[dict[str, Any]]) -> None:
    _ensure_store()
    with ORDERS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(orders, handle, indent=2)


def create_order(order: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        orders = _read_orders()
        timestamp = _now_iso()
        stored = {
            **order,
            "created_at": order.get("created_at", timestamp),
            "updated_at": timestamp,
        }
        orders.append(stored)
        _write_orders(orders)
        return stored


def get_order(order_id: str) -> dict[str, Any] | None:
    with _LOCK:
        orders = _read_orders()
    for order in orders:
        if order.get("id") == order_id:
            return order
    return None


def list_orders() -> list[dict[str, Any]]:
    with _LOCK:
        return _read_orders()


def update_order(order_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    with _LOCK:
        orders = _read_orders()
        for index, order in enumerate(orders):
            if order.get("id") != order_id:
                continue
            next_order = {
                **order,
                **updates,
                "updated_at": _now_iso(),
            }
            orders[index] = next_order
            _write_orders(orders)
            return next_order
    return None


def upsert_order(order: dict[str, Any]) -> dict[str, Any]:
    existing = get_order(str(order.get("id", "")))
    if existing is None:
        return create_order(order)
    return update_order(existing["id"], order) or existing
