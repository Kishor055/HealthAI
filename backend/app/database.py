"""
HealthAI PRO — Clinical Data Store & Repository
Manages authenticated profiles, active prescriptions, telemetry, and clinical interaction registries.
"""

from typing import Dict, List, Optional
from datetime import datetime

# In-Memory Clinical Database
USERS_DB: Dict[str, dict] = {
    "kishorkakde026@gmail.com": {
        "id": "admin-001",
        "email": "kishorkakde026@gmail.com",
        "full_name": "Kishor Kakde Patil",
        "role": "admin",
        "password_hash": "pbkdf2_sha256$260000$healthai$hashed_admin_pwd", # plain password check supported
        "blood_type": "O+",
        "allergies": "None recorded",
        "institution": "HealthAI Research Institute",
        "created_at": "2026-01-01T00:00:00Z",
        "is_active": True,
    },
    "specialist@healthai.clinic": {
        "id": "doc-002",
        "email": "specialist@healthai.clinic",
        "full_name": "Dr. Sarah Chen, MD",
        "role": "clinician",
        "password_hash": "pbkdf2_sha256$260000$healthai$hashed_doc_pwd",
        "blood_type": "A+",
        "allergies": "Penicillin",
        "institution": "Metropolitan Health System",
        "created_at": "2026-01-05T00:00:00Z",
        "is_active": True,
    },
    "patient@healthai.clinic": {
        "id": "pat-003",
        "email": "patient@healthai.clinic",
        "full_name": "Alex Mercer",
        "role": "patient",
        "password_hash": "pbkdf2_sha256$260000$healthai$hashed_pat_pwd",
        "blood_type": "B+",
        "allergies": "Sulfa drugs",
        "institution": "Community Care",
        "created_at": "2026-01-10T00:00:00Z",
        "is_active": True,
    }
}

# Known clinical interactions registry (Drug-Drug Interactions)
DRUG_INTERACTIONS_REGISTRY = [
    {
        "pair": ("warfarin", "aspirin"),
        "severity": "HIGH",
        "mechanism": "Additive antiplatelet and anticoagulant effects significantly augment severe bleeding risk.",
        "management": "Avoid concurrent use unless strictly indicated under intensive clinical monitoring (PT/INR).",
        "category": "Hematology / Cardiology"
    },
    {
        "pair": ("lisinopril", "spironolactone"),
        "severity": "HIGH",
        "mechanism": "Co-administration of ACE inhibitors with potassium-sparing diuretics may precipitate fatal hyperkalemia.",
        "management": "Monitor serum potassium and creatinine within 1-2 weeks of initiation and regularly thereafter.",
        "category": "Nephrology / Cardiology"
    },
    {
        "pair": ("metformin", "contrast agent"),
        "severity": "HIGH",
        "mechanism": "Iodinated radiocontrast can induce acute renal failure, causing lactic acidosis accumulation from metformin.",
        "management": "Withhold metformin 48h prior to and 48h following iodinated radiologic procedures.",
        "category": "Endocrinology"
    },
    {
        "pair": ("atorvastatin", "clarithromycin"),
        "severity": "HIGH",
        "mechanism": "Potent CYP3A4 inhibition increases statin exposure exponentially, elevating rhabdomyolysis risk.",
        "management": "Temporarily suspend atorvastatin during macrolide antibiotic course or switch to azithromycin.",
        "category": "Infectious Disease / Cardiology"
    },
    {
        "pair": ("fluoxetine", "tramadol"),
        "severity": "HIGH",
        "mechanism": "Synergistic serotonergic enhancement leading to Serotonin Syndrome and lowered seizure threshold.",
        "management": "Avoid combination. Consider alternative non-serotonergic analgesics.",
        "category": "Neurology / Psychiatry"
    },
    {
        "pair": ("amlodipine", "simvastatin"),
        "severity": "MODERATE",
        "mechanism": "Amlodipine increases simvastatin plasma concentrations via mild CYP3A4 inhibition.",
        "management": "Limit simvastatin dose to maximum 20 mg daily when co-prescribed with amlodipine.",
        "category": "Cardiology"
    },
    {
        "pair": ("ibuprofen", "lisinopril"),
        "severity": "MODERATE",
        "mechanism": "NSAIDs blunt renal prostaglandin synthesis, attenuating antihypertensive efficacy and accelerating renal strain.",
        "management": "Use acetaminophen for pain relief when possible; monitor blood pressure and renal function.",
        "category": "Rheumatology / Nephrology"
    },
    {
        "pair": ("metformin", "glipizide"),
        "severity": "MODERATE",
        "mechanism": "Dual hypoglycemia risk when sulfonylurea is added to biguanide regimen without caloric balance.",
        "management": "Educate patient on hypoglycemia recognition and ensure routine self-monitoring of blood glucose.",
        "category": "Endocrinology"
    }
]

# Baseline Emergency & Institutional Registry
INSTITUTIONAL_REGISTRY = [
    {
        "id": "inst-001",
        "name": "Apollo Super Specialty Hospital",
        "type": "Multi-Specialty Trauma & Emergency",
        "distance": "1.2 km",
        "phone": "+91 20 6767 8888",
        "emergency_unit": True,
        "blood_bank": True,
        "rating": 4.9,
        "address": "Senapati Bapat Road, Pune"
    },
    {
        "id": "inst-002",
        "name": "Ruby Hall Clinic & Research Center",
        "type": "Tertiary Care & Cardiac Center",
        "distance": "2.4 km",
        "phone": "+91 20 6645 5100",
        "emergency_unit": True,
        "blood_bank": True,
        "rating": 4.8,
        "address": "Sassoon Road, Pune"
    },
    {
        "id": "inst-003",
        "name": "KEM Hospital Emergency Unit",
        "type": "General Hospital & Intensive Care",
        "distance": "3.1 km",
        "phone": "+91 20 2606 1000",
        "emergency_unit": True,
        "blood_bank": True,
        "rating": 4.7,
        "address": "Rasta Peth, Pune"
    },
    {
        "id": "inst-004",
        "name": "Sahyadri Super Speciality Hospital",
        "type": "Neuro & Organ Transplant Center",
        "distance": "3.8 km",
        "phone": "+91 20 6721 3000",
        "emergency_unit": True,
        "blood_bank": False,
        "rating": 4.8,
        "address": "Deccan Gymkhana, Pune"
    }
]
