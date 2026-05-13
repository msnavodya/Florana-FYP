# Define Pydantic schemas for User API payloads.
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    contact: str = None
    location: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
