import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from root or backend directory
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'smartspend-default-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'smartspend-jwt-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24
    
    BASE_DIR = Path(__file__).resolve().parent
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR / 'smartspend.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = "*"
    
    # ML Models directory
    MODELS_DIR = Path(__file__).resolve().parent.parent / 'models'
    DATA_DIR = Path(__file__).resolve().parent.parent / 'data'
