# Define Pydantic schemas for Plant API payloads.
from typing import Optional

from pydantic import BaseModel


# Payload used when a client creates a new tracked plant record.
class PlantCreate(BaseModel):
    name: str
    species: Optional[str] = None
    sunlight: str = "Partial Sun"
    tracking: bool = True
    image_path: Optional[str] = None


# Response shape returned to the frontend after a plant has been stored.
class PlantRead(BaseModel):
    # Mongo ObjectIds are converted to strings before the frontend consumes them.
    id: str
    name: str
    species: Optional[str] = None
    sunlight: str = "Partial Sun"
    tracking: bool = True
    image_path: Optional[str] = None

    # These extra fields support richer UI cards, but older records may not include them.
    info: Optional[str] = None
    badges: Optional[list] = []
    warning: Optional[bool] = False

    class Config:
        # Allow this schema to read values from ORM-like objects as well as plain dictionaries.
        orm_mode = True
