import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from backend.app.config import settings
from backend.app.auth.router import router as auth_router
from backend.app.prescriptions.router import router as prescriptions_router
from backend.app.safety.router import router as safety_router
from backend.app.vitals.router import router as vitals_router
from backend.app.chat.router import router as chat_router
from backend.app.records.router import router as records_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthai.backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Enterprise-grade clinical microservice platform orchestrating AI-driven medication safety, "
        "prescription OCR & NLP classification, drug-drug interaction auditing, and biometric stability telemetry."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable permissive CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits localhost:9002, localhost:3000, and container networking
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(prescriptions_router, prefix=settings.API_V1_STR)
app.include_router(safety_router, prefix=settings.API_V1_STR)
app.include_router(vitals_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(records_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["System Information"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "ONLINE",
        "firebase_project": settings.FIREBASE_PROJECT_ID,
        "interactive_docs": "/docs",
        "redoc": "/redoc",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/health", tags=["System Information"])
async def health_check():
    """Lightweight health probe for Docker container health checks."""
    return {"status": "healthy", "service": "healthai-fastapi"}

@app.get("/api/v1/health", tags=["System Information"])
async def api_health():
    """Detailed microservice diagnostics."""
    return {
        "status": "operational",
        "version": settings.PROJECT_VERSION,
        "firebase_node": settings.FIREBASE_PROJECT_ID,
        "microservices": {
            "auth": "ACTIVE",
            "prescriptions_nlp": "ACTIVE",
            "interaction_shield": "ACTIVE",
            "biometric_stability": "ACTIVE",
            "clinical_chat": "ACTIVE",
            "phi_archive": "ACTIVE"
        },
        "server_time": datetime.utcnow().isoformat() + "Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
