import shutil
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
UPLOAD_DIR = PROJECT_ROOT / "uploads"
LEGACY_UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def sync_legacy_uploads() -> None:
    if not LEGACY_UPLOAD_DIR.exists() or LEGACY_UPLOAD_DIR == UPLOAD_DIR:
        return

    for file_path in LEGACY_UPLOAD_DIR.iterdir():
        if not file_path.is_file():
            continue

        target_path = UPLOAD_DIR / file_path.name
        if not target_path.exists():
            shutil.copy2(file_path, target_path)


def build_upload_disk_path(filename: str) -> Path:
    return UPLOAD_DIR / filename


def build_upload_public_path(filename: str) -> str:
    return f"uploads/{filename}".replace("\\", "/")


def build_upload_api_path(filename: str) -> str:
    return f"/uploads/{filename}".replace("\\", "/")


def resolve_uploaded_file_path(path_value: str | None) -> Path | None:
    if not path_value:
        return None

    normalized = path_value.replace("\\", "/").lstrip("/")
    path = Path(normalized)

    if path.is_absolute():
        return path

    if normalized.startswith("uploads/"):
        return PROJECT_ROOT / normalized

    return PROJECT_ROOT / path


sync_legacy_uploads()
