from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8001
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def can_open_port(host: str, port: int) -> bool:
    probe_host = "0.0.0.0" if host in {"0.0.0.0", "::"} else host
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server.bind((probe_host, port))
        except OSError:
            return False
    return True


def read_health(port: int) -> dict | None:
    url = f"http://127.0.0.1:{port}/health"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = response.read().decode("utf-8")
    except (OSError, urllib.error.URLError):
        return None

    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def is_florana_backend(health: dict | None) -> bool:
    return bool(health and health.get("server") == "Florana Backend")


def main() -> int:
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))

    parser = argparse.ArgumentParser(description="Start the Florana FastAPI backend safely.")
    parser.add_argument("--host", default=os.getenv("HOST", DEFAULT_HOST))
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", str(DEFAULT_PORT))))
    parser.add_argument("--reload", action="store_true", default=os.getenv("RELOAD", "false").lower() == "true")
    args = parser.parse_args()

    health = read_health(args.port)
    if is_florana_backend(health):
        ai_model = health.get("ai_model") or {}
        print(f"Florana backend is already running on http://127.0.0.1:{args.port}")
        print(f"Database: {(health.get('database') or {}).get('message', 'unknown')}")
        print(f"AI model: {ai_model.get('status', 'unknown')} (loaded={ai_model.get('loaded', False)})")
        print("Keep this process running; do not start another backend on 8001.")
        return 0

    if not can_open_port(args.host, args.port):
        print(f"ERROR: Port {args.port} is already in use by another service.")
        print(f"Close that process or use the existing Florana backend at http://127.0.0.1:{args.port}/health if it is healthy.")
        return 1

    os.environ["HOST"] = args.host
    os.environ["PORT"] = str(args.port)
    os.environ["RELOAD"] = "true" if args.reload else "false"

    import uvicorn

    uvicorn.run("backend.main:app", host=args.host, port=args.port, reload=args.reload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
