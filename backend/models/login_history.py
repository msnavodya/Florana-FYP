# Define backend data models for Login History records.
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True)
    email = Column(String(100))
    login_time = Column(DateTime, default=datetime.utcnow)
