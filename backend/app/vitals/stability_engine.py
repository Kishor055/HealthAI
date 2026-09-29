from typing import Dict, Any, Optional

def calculate_clinical_stability_index(
    heart_rate: float,
    systolic_bp: float,
    diastolic_bp: float,
    spo2: float,
    adherence_pct: float = 85.0
) -> Dict[str, Any]:
    penalties = 0.0
    flags = []
    
    # 1. Heart Rate (WHO Norm: 60 - 100 bpm)
    if heart_rate < 45 or heart_rate > 130:
        penalties += 35
        flags.append(f"Critical Heart Rate: {heart_rate} bpm (Arrhythmia risk)")
    elif heart_rate < 60:
        penalties += 12
        flags.append(f"Sinus Bradycardia: {heart_rate} bpm")
    elif heart_rate > 100:
        penalties += 15
        flags.append(f"Sinus Tachycardia: {heart_rate} bpm")
        
    # 2. Blood Pressure (AHA/WHO Standard)
    if systolic_bp >= 180 or diastolic_bp >= 120:
        penalties += 40
        flags.append(f"Hypertensive Crisis: {systolic_bp}/{diastolic_bp} mmHg")
    elif systolic_bp >= 140 or diastolic_bp >= 90:
        penalties += 20
        flags.append(f"Stage 2 Hypertension: {systolic_bp}/{diastolic_bp} mmHg")
    elif systolic_bp >= 130 or diastolic_bp >= 80:
        penalties += 10
        flags.append(f"Stage 1 Hypertension: {systolic_bp}/{diastolic_bp} mmHg")
    elif systolic_bp < 90 or diastolic_bp < 60:
        penalties += 18
        flags.append(f"Hypotension: {systolic_bp}/{diastolic_bp} mmHg")

    # 3. SpO2 Oxygen Saturation (Normal: 95% - 100%)
    if spo2 < 90:
        penalties += 40
        flags.append(f"Severe Hypoxemia: SpO2 {spo2}% (Immediate O2 required)")
    elif spo2 < 95:
        penalties += 18
        flags.append(f"Mild Hypoxia: SpO2 {spo2}%")
        
    # 4. Medication Adherence Factor
    if adherence_pct < 50:
        penalties += 25
        flags.append(f"Severe Non-Adherence: {adherence_pct}% adherence")
    elif adherence_pct < 80:
        penalties += 10
        flags.append(f"Sub-optimal Adherence: {adherence_pct}% adherence")

    csi_score = max(5.0, round(100.0 - penalties, 1))
    
    if csi_score >= 85:
        classification = "OPTIMAL_STABILITY"
        risk_level = "LOW"
        badge_color = "emerald"
    elif csi_score >= 70:
        classification = "COMPENSATED_STABILITY"
        risk_level = "MODERATE"
        badge_color = "blue"
    elif csi_score >= 50:
        classification = "PHYSIOLOGICAL_SKEW_DETECTED"
        risk_level = "HIGH"
        badge_color = "amber"
    else:
        classification = "CRITICAL_HEMODYNAMIC_DEVIATION"
        risk_level = "CRITICAL"
        badge_color = "red"

    return {
        "clinical_stability_index": csi_score,
        "classification": classification,
        "risk_level": risk_level,
        "badge_color": badge_color,
        "metrics": {
            "heart_rate": {"value": heart_rate, "unit": "bpm", "status": "Normal" if 60 <= heart_rate <= 100 else "Abnormal"},
            "systolic_bp": {"value": systolic_bp, "unit": "mmHg", "status": "Normal" if systolic_bp < 120 else "Elevated"},
            "diastolic_bp": {"value": diastolic_bp, "unit": "mmHg", "status": "Normal" if diastolic_bp < 80 else "Elevated"},
            "spo2": {"value": spo2, "unit": "%", "status": "Normal" if spo2 >= 95 else "Hypoxic"},
            "adherence": {"value": adherence_pct, "unit": "%", "status": "Compliant" if adherence_pct >= 80 else "Non-compliant"}
        },
        "physiological_flags": flags,
        "who_guidelines": "Correlated with WHO TRS 916 & Mayo Clinic Physiological Benchmarks"
    }
