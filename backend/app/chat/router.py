from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from backend.app.chat.assistant import generate_medication_response, triage_symptoms

router = APIRouter(prefix="/chat", tags=["Clinical Assistant & Symptom Triage"])

class MedicationQARequest(BaseModel):
    question: str
    active_medications: Optional[List[str]] = None
    patient_id: Optional[str] = None

class SymptomTriageRequest(BaseModel):
    symptoms: str
    duration_hours: Optional[int] = 24
    patient_age: Optional[int] = None

@router.post("/medication-qa")
async def answer_medication_question(req: MedicationQARequest):
    """
    Provides evidence-based clinical explanations for dosage, food timing,
    side effects, and missed doses with built-in healthcare safety disclaimers.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    return generate_medication_response(req.question, req.active_medications)

@router.post("/triage")
async def assess_symptoms(req: SymptomTriageRequest):
    """
    Performs algorithmic symptom triage (EMERGENCY, URGENT, ROUTINE)
    to categorize clinical urgency and guide the patient safely.
    """
    if not req.symptoms.strip():
        raise HTTPException(status_code=400, detail="Symptoms text cannot be empty.")
    return triage_symptoms(req.symptoms)
