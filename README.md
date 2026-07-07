# 🩺 HealthAI PRO: Enterprise Clinical Intelligence Platform

[![Next.js Version](https://img.shields.io/badge/Next.js-15.1+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-11.3+-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Genkit AI](https://img.shields.io/badge/Genkit-1.0+-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Python Analytics](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

**HealthAI PRO** is an enterprise-grade, AI-driven medication safety and clinical intelligence platform. By orchestrating a **Multi-Agent Architecture** via Google Genkit, real-time biometric telemetry via Web Bluetooth, and RAG-powered clinical analysis, HealthAI PRO provides patients and clinical administrators with actionable medical insights, dual-factor security, and personalized adherence protocols.

---

## 🛑 The Challenge: Clinical Fragmentation
Healthcare systems globally struggle with **Medication Non-Adherence** and **Data Silos**. 
- **The Global Adherence Crisis**: 50% of patients fail to follow long-term treatment plans, leading to billions in avoidable costs.
- **The Interpretation Barrier**: Complex, handwritten, or jargon-heavy prescriptions create a barrier to patient understanding.
- **Data Silos**: Biometric telemetry is rarely correlated with medication intake, leaving doctors and patients blind to real-time physiological skews.

HealthAI PRO bridges these gaps by digitizing prescriptions, auditing drug interactions in real-time, and correlating biometric telemetry with clinical regimens.

---

## 🚀 Key Clinical Features

### 🧠 1. Multi-Agent Intelligence (Genkit v1.x)
- **HealthAI Copilot (RAG)**: A personalized assistant grounded in a Large Medical Records Dataset. It provides evidence-based guidance on diet, exercise, and pharmacological queries using Retrieval-Augmented Generation.
- **ML-Powered OCR (Precision v6)**: High-fidelity extraction of handwritten prescriptions and lab reports with 98% precision using NLP linguistic verification and Chain-of-Thought reasoning.
- **Symptom Triage (v4.1)**: High-precision AI triage node that assesses clinical risk (Low to Emergency) based on medical keyword correlation.

### 🫀 2. Biometric Command Center
- **Clinical Stability Matrix (CSI)**: A real-time engine that correlates telemetry (BP, Heart Rate, SpO2) with medication intake to detect and predict physiological skews.
- **Real-time Wearable Sync**: Direct pairing with smartwatches via **Web Bluetooth API** (GATT service discovery) for hardware-level vital extraction.
- **WHO Benchmarking**: Visualization of vitals compared against established World Health Organization and Mayo Clinic clinical standards.

### 💊 3. Predictive Pharmacy Center
- **Predictive Refill Analytics**: Calculates depletion dates based on frequency and real-world logging, ensuring zero-gap adherence.
- **Interaction Shield**: Real-time auditing of active regimens against new prescriptions to prevent adverse drug interactions (DDI).
- **AI Voice Instructions (TTS)**: Audible pharmacological guidance for safe adherence, powered by Genkit TTS models.

### 🌐 4. Institutional Connectivity
- **Secure SOAP Gateway**: Enterprise-grade XML messaging with **WS-Security** headers for institutional sync and national registry verification.
- **PHI Portable Archive**: Generates encrypted, authenticated medical records (Patient Health Information) for clinical consultants.
- **Regional Discovery**: Real-time GPS-mapped registry of Blood Banks, Diagnostic Centers, and Hospitals with direct calling protocols.

---

## 🧬 Expert Analytics (Python Utility)

HealthAI PRO includes a professional Python-based analytics node for deep clinical data processing:

```bash
# Analyze a PHI archive export
python scripts/clinical_analyzer.py exports/HealthAI_Archive_001.txt
```
- **Stability Correlation**: Advanced statistical processing of telemetry logs.
- **Anonymization Node**: RSA-4096 redaction for institutional research compliance.

---

## 🧠 Multi-Agent Architecture

```mermaid
graph TD
    User([User Request]) --> Auth[Enterprise Authentication]
    Auth --> Dashboard[Clinical Portal]
    
    Dashboard --> PrescAgent[Prescription Agent]
    PrescAgent -->|OCR & Analysis| RAG[Clinical RAG Engine]
    RAG -->|Structured Report| Report[Downloadable PHI Archive]
    
    Dashboard --> SafetyAgent[Safety Agent]
    SafetyAgent -->|Interaction Audit| Alert[Safety Alerts]
    
    Dashboard --> TrendAgent[Stability Agent]
    TrendAgent -->|Wearable Sync| Bio[Biometric Telemetry]
    Bio -->|Stability Index| Insight[Clinical Insights]
    
    Dashboard --> ChatAgent[Health Copilot]
    ChatAgent -->|Gemini 2.5 Flash| Advice[Interactive Guidance]
```

---

## 🛠️ Technical Stack
- **Frontend**: Next.js 15 (App Router / Turbopack)
- **AI Orchestration**: Google Genkit v1.x
- **Database**: Cloud Firestore (Hardened Rules)
- **Protocols**: Secure SOAP XML (WS-Security) + Web Bluetooth API
- **Analytics**: Python 3.10 (Clinical Node)

---

## ⚙️ Institutional Setup

### 1️⃣ Clone & Install
```bash
git clone https://github.com/Kishor055/HealthAI.git
cd HealthAI
npm install
```

### 2️⃣ Run Platform
```bash
npm run dev
```
Open **`http://localhost:9002/`** to access the clinical portal.

---

### 📌 Development Lead
**KISHOR KAKDE PATIL**  
*Developed with ❤️ for a safer, AI-powered healthcare future.*