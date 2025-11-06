from fastapi import APIRouter, Query
from datetime import datetime
from typing import Optional, Tuple
import os
import requests
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, FitbitToken
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/fitbit", tags=["Fitbit Data"])


CLIENT_ID = os.getenv("FITBIT_CLIENT_ID")
CLIENT_SECRET = os.getenv("FITBIT_CLIENT_SECRET")
TOKEN_URL = "https://api.fitbit.com/oauth2/token"


# -------- Helpers --------
def _parse_date(d: Optional[str]) -> str:
    """Accepts ISO (YYYY-MM-DD) or US (MM/DD/YY or MM/DD/YYYY). Defaults to today."""
    if not d or d.strip() == "":
        return datetime.today().strftime("%Y-%m-%d")
    d = d.strip()
    # Try ISO
    for fmt in ("%Y-%m-%d", "%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(d, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Fallback: today
    return datetime.today().strftime("%Y-%m-%d")


def _get_latest_user_and_token(db: Session) -> Tuple[Optional[User], Optional[FitbitToken]]:
    """Use the most recently created user and latest token row."""
    user = db.query(User).order_by(User.id.desc()).first()
    if not user:
        return None, None
    token = (
        db.query(FitbitToken)
        .filter(FitbitToken.user_id == user.id)
        .order_by(FitbitToken.id.desc())
        .first()
    )
    return user, token


def _refresh_token(db: Session, token_row: FitbitToken) -> Optional[FitbitToken]:
    """Refresh access token on 401. Insert a new FitbitToken row and return it."""
    data = {
        "grant_type": "refresh_token",
        "refresh_token": token_row.refresh_token,
        "client_id": CLIENT_ID,
    }
    resp = requests.post(
        TOKEN_URL,
        data=data,
        auth=(CLIENT_ID, CLIENT_SECRET),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if resp.status_code != 200:
        return None

    td = resp.json()
    new_row = FitbitToken(
        user_id=token_row.user_id,
        access_token=td.get("access_token"),
        refresh_token=td.get("refresh_token"),
        scope=td.get("scope"),
        expires_in=td.get("expires_in"),
        token_type=td.get("token_type"),
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row


def _fitbit_get(path: str, db: Session) -> Tuple[int, dict]:
    """Call Fitbit with stored token; on 401, refresh and retry once."""
    _, token_row = _get_latest_user_and_token(db)
    if not token_row:
        return 400, {"error": "No Fitbit token found. Please login at /fitbit/login."}

    headers = {"Authorization": f"Bearer {token_row.access_token}"}
    resp = requests.get(f"https://api.fitbit.com{path}", headers=headers)

    if resp.status_code == 401:
        # try refresh
        new_token = _refresh_token(db, token_row)
        if not new_token:
            return 401, {"error": "Token expired and refresh failed. Please re-login."}
        headers = {"Authorization": f"Bearer {new_token.access_token}"}
        resp = requests.get(f"https://api.fitbit.com{path}", headers=headers)

    if resp.status_code != 200:
        try:
            details = resp.json()
        except Exception:
            details = {"raw": resp.text}
        return resp.status_code, {"error": "Fitbit API request failed", "details": details}

    return 200, resp.json()


# -------- Endpoints --------

@router.get("/steps")
def get_steps(date: Optional[str] = Query(None, description="YYYY-MM-DD or MM/DD/YY")):
    """
    Returns cleaned daily steps for the given date (defaults to today).
    Example cleaned response: { "date": "2025-11-04", "steps": 6521 }
    """
    db = SessionLocal()
    day = _parse_date(date)
    status, data = _fitbit_get(f"/1/user/-/activities/steps/date/{day}/1d.json", db)
    if status != 200:
        return data

    # Cleaned
    steps_list = data.get("activities-steps", [])
    value = 0
    if steps_list and "value" in steps_list[0]:
        try:
            value = int(steps_list[0]["value"])
        except Exception:
            value = 0
    return {"date": day, "steps": value}


@router.get("/sleep")
def get_sleep(date: Optional[str] = Query(None, description="YYYY-MM-DD or MM/DD/YY")):
    """
    Returns cleaned sleep summary for the given date (defaults to today).
    Example cleaned response:
    {
      "date": "2025-11-04",
      "total_minutes_asleep": 412,
      "total_time_in_bed": 450,
      "stages": {"deep": 55, "light": 220, "rem": 85, "wake": 90}
    }
    """
    db = SessionLocal()
    day = _parse_date(date)
    status, data = _fitbit_get(f"/1.2/user/-/sleep/date/{day}.json", db)
    if status != 200:
        return data

    summary = data.get("summary", {}) or {}
    stages = summary.get("stages", {}) or {}

    cleaned = {
        "date": day,
        "total_minutes_asleep": summary.get("totalMinutesAsleep", 0),
        "total_time_in_bed": summary.get("totalTimeInBed", 0),
        "stages": {
            "deep": stages.get("deep", 0),
            "light": stages.get("light", 0),
            "rem": stages.get("rem", 0),
            "wake": stages.get("wake", 0),
        },
    }
    return cleaned


@router.get("/heartrate")
def get_heartrate(date: Optional[str] = Query(None, description="YYYY-MM-DD or MM/DD/YY")):
    """
    Returns cleaned heart rate summary for the given date (defaults to today).
    Example cleaned response:
    {
      "date": "2025-11-04",
      "resting_heart_rate": 61,
      "zones": [{"name":"Out of Range","min":30,"max":94,"minutes":840}, ...]
    }
    """
    db = SessionLocal()
    day = _parse_date(date)
    status, data = _fitbit_get(f"/1/user/-/activities/heart/date/{day}/1d.json", db)
    if status != 200:
        return data

    # Format: {"activities-heart":[{"dateTime":"YYYY-MM-DD","value":{"restingHeartRate":..., "heartRateZones":[...]}}]}
    arr = data.get("activities-heart", [])
    resting = None
    zones_out = []
    if arr:
        value = arr[0].get("value", {})
        resting = value.get("restingHeartRate", None)
        zones = value.get("heartRateZones", []) or []
        for z in zones:
            zones_out.append({
                "name": z.get("name"),
                "min": z.get("min"),
                "max": z.get("max"),
                "minutes": z.get("minutes"),
            })

    return {
        "date": day,
        "resting_heart_rate": resting,
        "zones": zones_out,
    }
