# Define backend data models for Plant records.
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=True)
    sunlight = Column(String, nullable=True)
    tracking = Column(Boolean, default=True)
    image_path = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="plants")
