from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from pathlib import Path
import os

#Force-load .env even when script is run manually
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

#Build database URL from .env variables
DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)

print("\n✅ Loaded DATABASE_URL:", DATABASE_URL)

#SQLAlchemy engine + session
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Base class for creating models
Base = declarative_base()


