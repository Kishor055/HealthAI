import os
from typing import List

class Settings:
    PROJECT_NAME: str = "HealthAI PRO Clinical API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Security
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "healthai_pro_clinical_secure_enterprise_key_2026_x77")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Firebase Reference
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "studio-5305454790-ef005")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:9002",
        "http://127.0.0.1:9002",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

settings = Settings()
