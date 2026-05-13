# Define backend data models for User records.
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)

    plants = relationship("Plant", back_populates="user")
