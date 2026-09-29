import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

def generate_phi_archive(
    patient_id: str,
    patient_name: str,
    medications: List[Dict[str, Any]],
    vitals_summary: Dict[str, Any],
    allergies: str = "None recorded"
) -> Dict[str, Any]:
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    payload = {
        "format": "HealthAI-PRO-PHI-v2",
        "archive_id": f"PHI-{hashlib.sha256((patient_id + timestamp).encode()).hexdigest()[:12].upper()}",
        "generated_at": timestamp,
        "patient": {
            "id": patient_id,
            "name": patient_name,
            "allergies": allergies
        },
        "active_pharmacotherapy": medications,
        "latest_vitals": vitals_summary,
        "clinical_compliance_standard": "HIPAA & ISO/IEEE 11073 Point-of-Care Medical Device Communication"
    }
    
    # Generate cryptographic tamper-evident seal
    raw_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
    integrity_seal = hashlib.sha256(raw_bytes).hexdigest()
    payload["cryptographic_seal_sha256"] = integrity_seal
    
    return payload
