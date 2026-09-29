from typing import List, Dict, Any
from backend.app.database import DRUG_INTERACTIONS_REGISTRY

def check_drug_interactions(medications: List[str]) -> Dict[str, Any]:
    cleaned_meds = [m.lower().strip() for m in medications if m and m.strip()]
    found_interactions = []
    
    for i in range(len(cleaned_meds)):
        for j in range(i + 1, len(cleaned_meds)):
            med_a = cleaned_meds[i]
            med_b = cleaned_meds[j]
            
            for item in DRUG_INTERACTIONS_REGISTRY:
                pair_a, pair_b = item["pair"]
                
                # Check bidirectional match
                match_1 = (pair_a in med_a and pair_b in med_b)
                match_2 = (pair_a in med_b and pair_b in med_a)
                
                if match_1 or match_2:
                    found_interactions.append({
                        "drugs": [med_a.capitalize(), med_b.capitalize()],
                        "severity": item["severity"],
                        "mechanism": item["mechanism"],
                        "management": item["management"],
                        "category": item["category"]
                    })

    # Duplicate drug detection
    duplicates = []
    seen = set()
    for m in cleaned_meds:
        base_name = m.split()[0]
        if base_name in seen:
            duplicates.append(base_name.capitalize())
        seen.add(base_name)

    # Compute safety index
    high_count = sum(1 for x in found_interactions if x["severity"] == "HIGH")
    mod_count = sum(1 for x in found_interactions if x["severity"] == "MODERATE")
    
    regimen_score = max(10, 100 - (high_count * 35) - (mod_count * 15) - (len(duplicates) * 20))
    
    if high_count > 0:
        overall_status = "CRITICAL_INTERACTION_DETECTED"
        safety_color = "red"
    elif mod_count > 0 or len(duplicates) > 0:
        overall_status = "MODERATE_WARNINGS"
        safety_color = "amber"
    else:
        overall_status = "REGIMEN_SAFE"
        safety_color = "green"

    return {
        "status": overall_status,
        "safety_index_score": regimen_score,
        "safety_color": safety_color,
        "total_medications_checked": len(cleaned_meds),
        "total_conflicts_found": len(found_interactions),
        "interactions": found_interactions,
        "duplicate_therapies": duplicates,
        "clinical_summary": (
            f"Detected {high_count} high-risk drug interaction(s) and {mod_count} moderate interaction(s) across {len(cleaned_meds)} medications."
            if found_interactions else
            f"All {len(cleaned_meds)} evaluated medications have acceptable safety compatibility with no known severe contraindications."
        )
    }
