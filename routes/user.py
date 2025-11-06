# routes/user.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models import User, FitbitToken
from database import SessionLocal
from datetime import datetime
import secrets
import hashlib

router = APIRouter(prefix="/users", tags=["Users"])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str
    created_at: datetime
    fitbit_connected: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    """Simple password hashing for demo"""
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.fitbit_user_id.like(f"local_{user_data.username}_%")).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    user = User(
        fitbit_user_id=f"local_{user_data.username}_{hash_password(user_data.password)}",
        created_at=datetime.utcnow()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = secrets.token_urlsafe(32)
    
    # Check if user has Fitbit connected
    fitbit_connected = db.query(FitbitToken).filter(FitbitToken.user_id == user.id).first() is not None
    
    user_response = UserResponse(
        id=user.id,
        username=user_data.username,
        email=user_data.email,
        name=user_data.name,
        created_at=user.created_at,
        fitbit_connected=fitbit_connected
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with username and password
    """
    # Find user by username and password hash
    expected_fitbit_id = f"local_{login_data.username}_{hash_password(login_data.password)}"
    user = db.query(User).filter(User.fitbit_user_id == expected_fitbit_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = secrets.token_urlsafe(32)
    
    # Check if user has Fitbit connected
    fitbit_connected = db.query(FitbitToken).filter(FitbitToken.user_id == user.id).first() is not None
    
    user_response = UserResponse(
        id=user.id,
        username=login_data.username,
        email=f"{login_data.username}@calmcast.com",  # Demo email
        name=login_data.username,  # Demo name
        created_at=user.created_at,
        fitbit_connected=fitbit_connected
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer", 
        user=user_response
    )

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    fitbit_connected = db.query(FitbitToken).filter(FitbitToken.user_id == user_id).first() is not None
    
    # Extract username from fitbit_user_id
    username = "Fitbit User"
    if user.fitbit_user_id and user.fitbit_user_id.startswith('local_'):
        username = user.fitbit_user_id.split('_')[1]
    
    return {
        "user_id": user.id,
        "username": username,
        "fitbit_connected": fitbit_connected
    }