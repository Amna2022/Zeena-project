import os

class Config:
    # Basic app secret (change later)
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

    # SQLite database file (created automatically)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///zeena.db")

    # Disable tracking to reduce overhead
    SQLALCHEMY_TRACK_MODIFICATIONS = False