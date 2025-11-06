from fastapi import APIRouter
import os
import requests
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from urllib.parse import urlencode

#DB Imports
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, FitbitToken   # <-- matches your models.py

load_dotenv()

router = APIRouter(prefix="/fitbit", tags=["Fitbit OAuth"])

CLIENT_ID = os.getenv("FITBIT_CLIENT_ID")
CLIENT_SECRET = os.getenv("FITBIT_CLIENT_SECRET")
REDIRECT_URI = os.getenv("FITBIT_REDIRECT_URI")

AUTH_URL = "https://www.fitbit.com/oauth2/authorize"
TOKEN_URL = "https://api.fitbit.com/oauth2/token"

SCOPES = "activity heartrate sleep profile"


@router.get("/login")
def fitbit_login():
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "scope": SCOPES,
        "redirect_uri": REDIRECT_URI,
    }
    url = f"{AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/callback")
def fitbit_callback(code: str):
    """Callback from Fitbit after login"""

    #Exchange auth code for access + refresh tokens
    data = {
        "client_id": CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
        "code": code,
    }

    response = requests.post(
        TOKEN_URL,
        data=data,
        auth=(CLIENT_ID, CLIENT_SECRET),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    if response.status_code != 200:
        return {"error": "Failed to get access token", "details": response.json()}

    token_data = response.json()

    # 2️⃣ Save tokens to database
    db: Session = SessionLocal()

    # Create new user row
    user = User(fitbit_user_id=token_data.get("user_id"))
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create token row linked to user
    token_entry = FitbitToken(
        user_id=user.id,
        access_token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        scope=token_data.get("scope"),
        expires_in=token_data.get("expires_in"),
        token_type=token_data.get("token_type"),
    )

    db.add(token_entry)
    db.commit()

    return {"message": "Fitbit authentication successful — tokens stored in database!"}
