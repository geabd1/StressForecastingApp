from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fitbit_user_id = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tokens = relationship("FitbitToken", back_populates="user", cascade="all, delete")


class FitbitToken(Base):
    __tablename__ = "fitbit_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(String)
    refresh_token = Column(String)
    scope = Column(String)
    expires_in = Column(Integer)
    token_type = Column(String)

    user = relationship("User", back_populates="tokens")

