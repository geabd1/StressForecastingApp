# backend_main.py
from fastapi import FastAPI
from dotenv import load_dotenv
from database import DATABASE_URL
from fastapi.middleware.cors import CORSMiddleware # <--- ADD THIS IMPORT
from routes import user, fitbit_oauth, fitbit_data

load_dotenv()

origins = [
    # Allow your local development server (crucial for local testing)
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500", # Common for VS Code Live Server
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500", 
    # Add your deployed frontend URL here if you deploy it later:
    # "https://your-frontend-domain.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Authorization, Content-Type, etc.)
)

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
