from fastapi import APIRouter

router = APIRouter(prefix="/fitbit", tags=["Fitbit"])

@router.get("/data")
def get_fitbit_data():
    # Simulated data for demo purposes
    data = {
        "heart_rate": 72,
        "steps": 5300,
        "sleep_hours": 6.8
    }
    return {"status": "success", "data": data}

