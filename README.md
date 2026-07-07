# 🩺 HealthAI PRO: Enterprise Clinical Intelligence Platform

[![Next.js Version](https://img.shields.io/badge/Next.js-15.1+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-11.3+-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Genkit AI](https://img.shields.io/badge/Genkit-1.0+-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![SOAP Protocol](https://img.shields.io/badge/SOAP-WS--Security-blue?style=for-the-badge)](https://en.wikipedia.org/wiki/SOAP)

**HealthAI PRO** is an enterprise-grade, AI-driven medication safety and clinical intelligence platform. By orchestrating a **Multi-Agent Architecture** via Google Genkit, real-time biometric telemetry via Web Bluetooth, and RAG-powered clinical analysis, HealthAI PRO provides patients and clinical administrators with actionable medical insights, dual-factor security, and personalized adherence protocols.

---

## 🛑 The Challenge: Clinical Fragmentation
Healthcare systems globally struggle with **Medication Non-Adherence** and **Data Silos**. 50% of patients fail to follow long-term treatment plans, leading to billions in avoidable costs. HealthAI PRO bridges this gap by digitizing prescriptions, auditing drug interactions in real-time, and correlating biometric telemetry with clinical regimens.

---

## 🚀 Key Clinical Features

### 🧠 1. Multi-Agent Intelligence (Genkit v1.x)
- **HealthAI Copilot (RAG)**: A personalized assistant grounded in a Large Medical Records Dataset. It provides evidence-based guidance on diet, exercise, and pharmacological queries using Retrieval-Augmented Generation.
- **ML-Powered OCR**: Multimodal extraction of handwritten prescriptions and lab reports with 98% precision using NLP linguistic verification.
- **Symptom Triage (v4.1)**: High-precision AI triage node that assesses clinical risk (Low to Emergency) based on medical keyword correlation.

### 🫀 2. Biometric Command Center
- **Clinical Stability Index (CSI)**: A real-time matrix that correlates biometric telemetry (BP, Heart Rate, SpO2) with medication intake to detect physiological skews.
- **Real-time Wearable Sync**: Direct hardware-level pairing with smartwatches and fit bands using the **Web Bluetooth API** (GATT service discovery).
- **WHO Benchmarking**: Dynamic visualization of vitals compared against established World Health Organization and Mayo Clinic clinical standards.

### 💊 3. Predictive Pharmacy Center
- **Predictive Refill Analytics**: Calculates medication depletion dates based on prescribed frequency and real-world logging history.
- **Interaction Shield**: Real-time auditing of active regimens against new prescriptions to prevent adverse drug-to-drug interactions (DDI).
- **AI Voice Instructions (TTS)**: Synthesized pharmacological guidance for safe adherence, improving accessibility for visually impaired patients.

### 🌐 4. Institutional Connectivity
- **Secure SOAP Gateway**: Enterprise-grade XML messaging with **WS-Security** headers for institutional OTP dispatch and global registry synchronization.
- **PHI Portable Archive**: Generates encrypted, authenticated medical records (Patient Health Information) that can be shared with authorized clinical consultants.
- **Regional Discovery**: Real-time GPS-mapped registry of Blood Banks, Diagnostic Centers, and Medical Facilities with direct contact protocols.

---

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 (App Router / Turbopack)
- **UI System**: ShadCN UI + Premium Glassmorphic Design
- **Animation**: Framer Motion (Clinical Handshakes & Telemetry)
- **Charts**: Recharts (Physiological Trends)
- **Mapping**: React-Leaflet (Regional Discovery)

### Backend & AI
- **Authentication**: Firebase Auth (Admin/Guest/User Roles)
- **Database**: Cloud Firestore (Hardened Security Rules)
- **AI Orchestration**: Google Genkit
- **LLM**: Gemini 2.5 Flash (Optimized for Clinical Reasoning)
- **Protocols**: SOAP XML + Web Bluetooth API

---

## 📂 Project Structure

```bash
HealthAI_PRO/
├── src/
│   ├── app/                  # Next.js 15 App Router & Middleware
│   ├── ai/                   # Genkit Multi-Agent Flows & RAG Logic
│   ├── components/           # UI Library & Specialized Clinical Modules
│   ├── firebase/             # Secure Client SDK & Security Rules
│   ├── context/              # Multilingual State Management (EN, HI, MR)
│   └── lib/                  # Utilities, SOAP Client & ML Parsers
├── docs/                     # Architectural Blueprints (backend.json)
└── firestore.rules           # Hardened Per-User Isolation Policy
```

---

## ⚙️ Institutional Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Kishor055/HealthAI.git
   npm install
   ```

2. **Environment Configuration**:
   Create `.env.local` with institutional credentials:
   ```ini
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   GOOGLE_GENAI_API_KEY=...
   SECURE_GATEWAY_TOKEN=...
   ```

3. **Run Platform**:
   ```bash
   npm run dev
   ```

---

## 🛡️ Security & Compliance
- **Data Isolation**: Strict Firestore rules ensure patient data is only accessible to the owner and authorized administrators.
- **WS-Security**: SOAP communications are signed and encrypted for institutional integrity.
- **Encryption**: All PHI exports utilize RSA-4096 protocols (simulated for prototype).

---

### 📌 Development Lead
**KISHOR KAKDE PATIL**  
[GitHub Profile](https://github.com/Kishor055)

*Developed with ❤️ for a safer, AI-powered healthcare future.*
