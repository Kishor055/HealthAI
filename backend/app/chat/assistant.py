import re
from typing import Dict, Any, List, Optional

EMERGENCY_KEYWORDS = [
    "chest pain", "crushing", "heart attack", "shortness of breath",
    "difficulty breathing", "stroke", "face drooping", "arm weakness",
    "slurred speech", "loss of consciousness", "coughing blood",
    "anaphylaxis", "severe allergic reaction", "unresponsive", "blue lips"
]

URGENT_KEYWORDS = [
    "high fever", "persistent vomiting", "blood in urine", "severe abdominal pain",
    "asthma attack", "wheezing", "sprain", "fracture", "deep cut"
]

COMMON_MED_KNOWLEDGE = {
    "amlodipine": {
        "timing": "Usually taken once daily in the morning or evening. Consistency is key.",
        "food": "Can be taken with or without food.",
        "side_effects": "Peripheral edema (swollen ankles), dizziness, flushing, fatigue.",
        "missed_dose": "Take as soon as remembered unless it is almost time for the next dose. Never double up."
    },
    "metformin": {
        "timing": "Usually taken with morning and evening meals to minimize GI side effects.",
        "food": "Must be taken with food or immediately after meals.",
        "side_effects": "Nausea, mild abdominal cramping, metallic taste, diarrhea (transient).",
        "missed_dose": "Take with your next meal. Do not ingest on an empty stomach."
    },
    "atorvastatin": {
        "timing": "Once daily, preferably in the evening or at bedtime (cholesterol synthesis peaks at night).",
        "food": "Can be taken with or without food. Avoid grapefruit juice in large quantities.",
        "side_effects": "Muscle aches, mild liver enzyme changes, digestive discomfort.",
        "missed_dose": "Take if remembered within 12 hours; otherwise skip and continue normal schedule."
    },
    "lisinopril": {
        "timing": "Once daily at the same time each day.",
        "food": "Can be taken with or without food.",
        "side_effects": "Dry persistent cough, dizziness, elevated potassium levels.",
        "missed_dose": "Take as soon as remembered. Do not take two doses at once."
    },
    "salbutamol": {
        "timing": "Used as an acute rescue bronchodilator (1-2 puffs as needed for wheezing/tightness).",
        "food": "Not affected by meals.",
        "side_effects": "Transient tremors, palpitations, nervousness.",
        "missed_dose": "Take only when symptomatic. Not a maintenance steroid."
    }
}

def generate_medication_response(question: str, active_medications: Optional[List[str]] = None) -> Dict[str, Any]:
    q_lower = question.lower()
    found_med = None
    
    for med_name in COMMON_MED_KNOWLEDGE:
        if med_name in q_lower:
            found_med = med_name
            break
            
    if not found_med and active_medications:
        for med in active_medications:
            for known in COMMON_MED_KNOWLEDGE:
                if known in med.lower():
                    found_med = known
                    break
            if found_med:
                break
                
    if found_med:
        info = COMMON_MED_KNOWLEDGE[found_med]
        if "miss" in q_lower or "forgot" in q_lower:
            answer = f"**{found_med.capitalize()} Missed Dose Protocol:** {info['missed_dose']}"
        elif "food" in q_lower or "eat" in q_lower or "meal" in q_lower or "empty stomach" in q_lower:
            answer = f"**{found_med.capitalize()} Food Guidelines:** {info['food']}"
        elif "side effect" in q_lower or "risk" in q_lower or "harm" in q_lower:
            answer = f"**Common Side Effects of {found_med.capitalize()}:** {info['side_effects']}"
        else:
            answer = (
                f"**Clinical Guidance for {found_med.capitalize()}:**\n"
                f"- **Administration Schedule:** {info['timing']}\n"
                f"- **Food Instructions:** {info['food']}\n"
                f"- **Expected Reactions & Side Effects:** {info['side_effects']}\n"
                f"- **Missed Dose Action:** {info['missed_dose']}"
            )
    else:
        answer = (
            "Regarding your clinical medication query: Always adhere to the exact regimen specified on your prescription packaging. "
            "Take solid oral dosage forms with a full glass of water. If taking multiple therapies, space them according to your pharmacist's guidance. "
            "Never double up on missed doses to compensate."
        )

    disclaimer = "Medical Disclaimer: HealthAI provides evidence-based guidance for informational purposes and does not replace the diagnosis or personalized instruction of your attending physician."

    return {
        "response": answer,
        "matched_drug": found_med.capitalize() if found_med else None,
        "disclaimer": disclaimer,
        "timestamp": "2026-09-18T00:00:00Z"
    }

def triage_symptoms(symptoms_text: str) -> Dict[str, Any]:
    text_lower = symptoms_text.lower()
    
    # Check Emergency
    for kw in EMERGENCY_KEYWORDS:
        if kw in text_lower:
            return {
                "triage_level": "EMERGENCY",
                "severity_score": 95,
                "urgency": "Immediate Emergency Medical Services (EMS) Required",
                "badge_color": "red",
                "trigger_keyword": kw,
                "recommended_action": "Call emergency services immediately (911 / 112 / 108) or proceed to the nearest trauma center without delay.",
                "disclaimer": "This is an automated safety alert. Severe symptoms require in-person emergency intervention."
            }
            
    # Check Urgent
    for kw in URGENT_KEYWORDS:
        if kw in text_lower:
            return {
                "triage_level": "URGENT",
                "severity_score": 70,
                "urgency": "Consult a physician within 4 to 12 hours",
                "badge_color": "amber",
                "trigger_keyword": kw,
                "recommended_action": "Visit an urgent care clinic or schedule a same-day medical appointment. Monitor vitals closely.",
                "disclaimer": "If symptoms worsen rapidly or breathing becomes labored, seek immediate emergency care."
            }
            
    # Routine / Self-care
    return {
        "triage_level": "ROUTINE",
        "severity_score": 30,
        "urgency": "Routine clinical follow-up or supervised self-care",
        "badge_color": "emerald",
        "trigger_keyword": None,
        "recommended_action": "Rest, maintain adequate hydration, and log symptom evolution in your HealthAI journal. Consult your primary care physician if unresolved in 48-72 hours.",
        "disclaimer": "Consult your healthcare provider if symptoms persist or new indicators arise."
    }
