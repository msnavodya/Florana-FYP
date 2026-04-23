import json
import os
from datetime import datetime
from threading import Lock
from uuid import uuid4


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_LOCK = Lock()


def _path(name):
    return os.path.join(BASE_DIR, name)


PLANTS_FILE = _path("plants.local.json")
PRODUCTS_FILE = _path("products.local.json")
GROWTH_FILE = _path("growth.local.json")
PREDICTIONS_FILE = _path("predictions.local.json")


def _read_json(path):
    if not os.path.exists(path):
        return []

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


def _write_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def list_items(path):
    return _read_json(path)


def create_item(path, item):
    with _LOCK:
        records = _read_json(path)
        stored = {"_id": str(uuid4()), **item}
        records.append(stored)
        _write_json(path, records)
        return stored


def find_item(path, predicate):
    records = _read_json(path)
    return next((record for record in records if predicate(record)), None)


def filter_items(path, predicate):
    return [record for record in _read_json(path) if predicate(record)]


def delete_item(path, predicate):
    with _LOCK:
        records = _read_json(path)
        remaining = [record for record in records if not predicate(record)]
        deleted = len(records) - len(remaining)
        if deleted:
            _write_json(path, remaining)
        return deleted


def now_iso():
    return datetime.utcnow().isoformat()
