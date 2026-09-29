from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.app.records.phi_archive import generate_phi_archive
from backend.app.database import INSTITUTIONAL_REGISTRY

router = APIRouter(prefix="/records", tags=["Clinical Records & Hospital Registry"])

class ExportPHIRequest(BaseModel):
    patient_id: str
    patient_name: str
    medications: Optional[List[Dict[str, Any]]] = []
    vitals_summary: Optional[Dict[str, Any]] = {
        "heart_rate": 72,
        "blood_pressure": "118/76",
        "spo2": 98,
        "stability_index": 92.5
    }
    allergies: Optional[str] = "None recorded"

@router.post("/export-phi")
async def export_patient_archive(req: ExportPHIRequest):
    """
    Generates a cryptographically signed Patient Health Information (PHI)
    portable archive compliant with clinical portability standards.
    """
    return generate_phi_archive(
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        medications=req.medications or [],
        vitals_summary=req.vitals_summary or {},
        allergies=req.allergies or "None recorded"
    )

@router.get("/institutions")
async def get_emergency_institutions():
    """Returns certified regional medical facilities, trauma centers, and blood banks."""
    return {
        "total_institutions": len(INSTITUTIONAL_REGISTRY),
        "institutions": INSTITUTIONAL_REGISTRY
    }
