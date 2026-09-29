from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from backend.app.vitals.stability_engine import calculate_clinical_stability_index

router = APIRouter(prefix="/vitals", tags=["Biometric Telemetry & Clinical Stability"])

class StabilityRequest(BaseModel):
    heart_rate: float = Field(..., ge=20, le=250, description="Heart rate in beats per minute")
    systolic_bp: float = Field(..., ge=50, le=300, description="Systolic blood pressure in mmHg")
    diastolic_bp: float = Field(..., ge=30, le=200, description="Diastolic blood pressure in mmHg")
    spo2: float = Field(..., ge=50, le=100, description="Blood oxygen saturation percentage")
    adherence_percentage: Optional[float] = Field(85.0, ge=0, le=100, description="Medication compliance percentage")

@router.post("/calculate-stability")
async def calculate_stability(data: StabilityRequest):
    """
    Calculate the real-time Clinical Stability Index (CSI) by correlating
    hemodynamic vitals with pharmacological adherence.
    """
    return calculate_clinical_stability_index(
        heart_rate=data.heart_rate,
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        spo2=data.spo2,
        adherence_pct=data.adherence_percentage or 85.0
    )

@router.get("/benchmarks")
async def get_clinical_benchmarks():
    """Retrieve standard WHO / Mayo Clinic clinical thresholds."""
    return {
        "heart_rate": {
            "normal_range": "60 - 100 bpm",
            "bradycardia": "< 60 bpm",
            "tachycardia": "> 100 bpm"
        },
        "blood_pressure": {
            "optimal": "< 120 / < 80 mmHg",
            "elevated": "120-129 / < 80 mmHg",
            "stage_1_hypertension": "130-139 / 80-89 mmHg",
            "stage_2_hypertension": ">= 140 / >= 90 mmHg",
            "crisis": "> 180 / > 120 mmHg"
        },
        "spo2": {
            "normal": "95 - 100%",
            "mild_hypoxia": "91 - 94%",
            "critical_hypoxemia": "<= 90%"
        }
    }
