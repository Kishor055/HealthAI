from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.app.safety.ddi_engine import check_drug_interactions
from backend.app.database import DRUG_INTERACTIONS_REGISTRY

router = APIRouter(prefix="/safety", tags=["Drug Safety & Interaction Shield"])

class InteractionCheckRequest(BaseModel):
    medications: List[str]
    patient_age: Optional[int] = None
    renal_impairment: Optional[bool] = False

@router.post("/check-interactions")
async def verify_interactions(req: InteractionCheckRequest):
    """
    Real-time safety audit cross-referencing patient's active and prescribed medications.
    Evaluates adverse interactions, duplicate therapies, and provides clinical management protocols.
    """
    if not req.medications or len(req.medications) < 2:
        return {
            "status": "REGIMEN_SAFE",
            "safety_index_score": 100,
            "safety_color": "green",
            "total_medications_checked": len(req.medications) if req.medications else 0,
            "total_conflicts_found": 0,
            "interactions": [],
            "duplicate_therapies": [],
            "clinical_summary": "Single or no medication provided. No polypharmacy interactions detected."
        }
        
    return check_drug_interactions(req.medications)

@router.get("/alerts")
async def get_safety_alerts():
    """Retrieve indexed high-priority drug safety advisories."""
    return {
        "total_advisories": len(DRUG_INTERACTIONS_REGISTRY),
        "registry": DRUG_INTERACTIONS_REGISTRY
    }
