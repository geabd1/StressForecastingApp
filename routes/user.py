from fastapi import APIRouter

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/{user_id}")
def get_user(user_id: int):
    # Temporary mock user for demo
    return {
        "user_id": user_id,
        "name": "Demo User",
        "fitbit_connected": False
    }

