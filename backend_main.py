# backend_main.py
from fastapi import FastAPI
from dotenv import load_dotenv
from database import DATABASE_URL
from routes import user, fitbit_oauth, fitbit_data

load_dotenv()

print(f"\n Loaded DATABASE_URL: {DATABASE_URL}")
print(" backend_main.py loaded successfully\n")

app = FastAPI(title="Stress Prediction Backend")


@app.get("/")
def home():
    return {"message": "Backend is running successfully!"}


# -------- Register Routes --------
app.include_router(user.router)
app.include_router(fitbit_oauth.router)
app.include_router(fitbit_data.router)
