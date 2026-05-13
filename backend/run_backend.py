# Start the backend service with the local development configuration.
from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(Path(__file__).resolve().with_name(".env"))


def can_open_port(host: str, port: int) -> bool:
    # If we can bind here, the port is free for a new backend process.
    probe_host = "0.0.0.0" if host in {"0.0.0.0", "::"} else host
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server.bind((probe_host, port))
        except OSError:
            return False
    return True


def find_listening_pids(port: int) -> list[int]:
    if os.name != "nt":
        return []

    try:
        result = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return []

    pids: set[int] = set()
    for line in result.stdout.splitlines():
        # Parse Windows netstat output and keep only TCP listeners for the target port.
        parts = line.split()
        if len(parts) < 5 or parts[0].upper() != "TCP":
            continue

        local_address = parts[1]
        state = parts[3].upper()
        pid_text = parts[4]
        if state != "LISTENING":
            continue

        host_port = local_address.rsplit(":", 1)
        if len(host_port) != 2 or host_port[1] != str(port):
            continue

        try:
            pids.add(int(pid_text))
        except ValueError:
            continue

    return sorted(pids)


def stop_processes(pids: list[int]) -> bool:
    if not pids:
        return False

    current_pid = os.getpid()
    stopped_any = False
    for pid in pids:
        # Never attempt to terminate the helper process that is currently handling the request.
        if pid == current_pid:
            continue

        if os.name == "nt":
            result = subprocess.run(
                ["taskkill", "/PID", str(pid), "/F"],
                capture_output=True,
                text=True,
                check=False,
            )
            stopped = result.returncode == 0
        else:
            try:
                os.kill(pid, 15)
                stopped = True
            except OSError:
                stopped = False

        if stopped:
            print(f"Stopped existing backend process PID {pid}.")
            stopped_any = True
        else:
            print(f"Could not stop process PID {pid}. Close it manually and try again.")

    return stopped_any


def wait_for_port(host: str, port: int, timeout_seconds: float = 8) -> bool:
    # Give the OS a moment to release the port after a stop or restart request.
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if can_open_port(host, port):
            return True
        time.sleep(0.25)
    return can_open_port(host, port)


def read_health(port: int) -> dict | None:
    # Ask the running service for its health payload so we can confirm it is the Florana backend.
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

    # Support normal start, health inspection, stop, and restart from one CLI entry point.
    parser = argparse.ArgumentParser(description="Start the Florana FastAPI backend safely.")
    parser.add_argument("--host", default=os.getenv("HOST", DEFAULT_HOST))
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", str(DEFAULT_PORT))))
    parser.add_argument("--reload", action="store_true", default=os.getenv("RELOAD", "false").lower() == "true")
    parser.add_argument("--restart", action="store_true", help="Stop the existing Florana backend on this port before starting.")
    parser.add_argument("--stop", action="store_true", help="Stop the existing Florana backend on this port and exit.")
    parser.add_argument("--status", action="store_true", help="Print backend health and exit without starting a server.")
    args = parser.parse_args()

    health = read_health(args.port)

    if args.status:
        if is_florana_backend(health):
            ai_model = health.get("ai_model") or {}
            print(f"Florana backend is running on http://127.0.0.1:{args.port}")
            print(f"Database: {(health.get('database') or {}).get('message', 'unknown')}")
            print(f"AI model: {ai_model.get('status', 'unknown')} (loaded={ai_model.get('loaded', False)})")
            return 0

        if can_open_port(args.host, args.port):
            print(f"No service is listening on port {args.port}.")
            return 1

        pids = find_listening_pids(args.port)
        pid_text = f" PIDs: {', '.join(map(str, pids))}." if pids else ""
        print(f"Port {args.port} is in use, but it is not a healthy Florana backend.{pid_text}")
        return 1

    if args.stop:
        # Only stop a process when the health response confirms it is our backend.
        if not is_florana_backend(health):
            print(f"No healthy Florana backend is running on port {args.port}.")
            return 0 if can_open_port(args.host, args.port) else 1

        pids = find_listening_pids(args.port)
        if not pids:
            print(f"Florana backend is running on port {args.port}, but its process ID could not be detected.")
            print("Close the existing terminal or stop the Python process manually, then run this command again.")
            return 1

        print(f"Stopping Florana backend on port {args.port}...")
        stop_processes(pids)
        if not wait_for_port(args.host, args.port):
            print(f"ERROR: Port {args.port} is still in use after stopping the existing backend.")
            return 1

        print(f"Florana backend stopped. Port {args.port} is free.")
        return 0

    if args.restart and is_florana_backend(health):
        pids = find_listening_pids(args.port)
        if not pids:
            print(f"Florana backend is running on port {args.port}, but its process ID could not be detected.")
            print("Close the existing terminal or stop the Python process manually, then run this command again.")
            return 1

        print(f"Restart requested. Stopping Florana backend on port {args.port}...")
        stop_processes(pids)
        if not wait_for_port(args.host, args.port):
            print(f"ERROR: Port {args.port} is still in use after stopping the existing backend.")
            return 1
        health = None

    if is_florana_backend(health):
        ai_model = health.get("ai_model") or {}
        print(f"Florana backend is already running on http://127.0.0.1:{args.port}")
        print(f"Database: {(health.get('database') or {}).get('message', 'unknown')}")
        print(f"AI model: {ai_model.get('status', 'unknown')} (loaded={ai_model.get('loaded', False)})")
        print(f"Keep this process running; do not start another backend on {args.port}.")
        print("Use npm run backend:restart if you need a fresh backend process.")
        return 0

    if not can_open_port(args.host, args.port):
        pids = find_listening_pids(args.port)
        pid_text = f" PIDs: {', '.join(map(str, pids))}." if pids else ""
        print(f"ERROR: Port {args.port} is already in use by another service.")
        print(f"Close that process or change the backend port.{pid_text}")
        return 1

    os.environ["HOST"] = args.host
    os.environ["PORT"] = str(args.port)
    os.environ["RELOAD"] = "true" if args.reload else "false"
    # Downstream code can use this flag to know the safe launcher was used.
    os.environ["FLORANA_BACKEND_RUNNER"] = "1"

    import uvicorn

    uvicorn.run("backend.main:app", host=args.host, port=args.port, reload=args.reload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
