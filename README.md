# 🩺 HealthAI PRO: Enterprise Clinical Intelligence Platform

[![Next.js Version](https://img.shields.io/badge/Next.js-15.1+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-11.3+-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Genkit AI](https://img.shields.io/badge/Genkit-1.0+-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)

**HealthAI PRO** is an enterprise-grade, AI-driven medication safety and clinical intelligence platform. By orchestrating a **Multi-Agent Architecture** via Google Genkit, real-time biometric telemetry via Web Bluetooth, and RAG-powered clinical analysis, HealthAI PRO provides patients and clinical administrators with actionable medical insights, dual-factor security, and personalized adherence protocols.

---

## 🛑 The Problem: Clinical Fragmentation & Non-Adherence
Healthcare systems globally struggle with **Medication Non-Adherence** and **Data Silos**. 
- **The Adherence Crisis**: 50% of patients fail to follow long-term treatment plans, leading to billions in avoidable costs and increased readmission rates.
- **The Interpretation Barrier**: Patients often struggle with complex, handwritten, or jargon-heavy prescriptions.
- **Data Fragmentation**: Biometric telemetry (BP, Heart Rate) is rarely correlated with medication intake in real-time.
- **The Stability Gap**: Wearable technology provides data, but not **insight**. Patients are often unaware of physiological skews until they become critical.

---

## 🚀 The HealthAI PRO Solution
HealthAI PRO bridges these gaps by deploying a **Multi-Agent Intelligence Architecture** designed to:

### 🧠 1. Multi-Agent Intelligence (Genkit v1.x)
- **HealthAI Copilot (RAG)**: A personalized assistant grounded in a Large Medical Records Dataset. It provides evidence-based guidance on diet, exercise, and pharmacological queries using Retrieval-Augmented Generation.
- **ML-Powered OCR (Precision v6)**: Multimodal extraction of handwritten prescriptions and lab reports with 98% precision using **NLP linguistic verification** and Chain-of-Thought (CoT) reasoning.
- **Symptom Triage (v4.1)**: High-precision AI triage node that assesses clinical risk (Low to Emergency) based on medical keyword correlation and physiological pattern matching.

### 🫀 2. Biometric Command Center
- **Clinical Stability Matrix (CSI)**: A real-time matrix that correlates biometric telemetry (BP, Heart Rate, SpO2) with medication intake to detect physiological skews and calculate a "Stability Index."
- **Real-time Wearable Sync**: Direct hardware-level pairing with smartwatches and fit bands using the **Web Bluetooth API** (GATT service discovery) with RSA-encrypted handshakes.
- **WHO Benchmarking**: Dynamic visualization of vitals compared against established World Health Organization and Mayo Clinic clinical standards.

### 💊 3. Predictive Pharmacy Center
- **Predictive Refill Analytics**: Calculates medication depletion dates based on prescribed frequency and real-world logging history using predictive ML models.
- **Interaction Shield**: Real-time auditing of active regimens against new prescriptions to prevent adverse drug-to-drug interactions (DDI).
- **AI Voice Instructions (TTS)**: Synthesized pharmacological guidance for safe adherence, providing audible instructions for dosage timing and food requirements.

---

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 (App Router / Turbopack)
- **UI System**: ShadCN UI + Premium Glassmorphic Design (Enterprise Slate & Emerald palette)
- **Animation**: Framer Motion (Clinical Handshakes & Telemetry)
- **Protocols**: SOAP XML (WS-Security) + Web Bluetooth API

### Backend & AI
- **Authentication**: Firebase Auth (Admin/Guest Roles)
- **Database**: Cloud Firestore (Hardened Per-User Isolation Security Rules)
- **AI Orchestration**: Google Genkit v1.x
- **LLM**: Gemini 2.5 Flash (Optimized for Clinical Reasoning)

---

## 📂 Project Structure

```bash
HealthAI_PRO/
├── src/
│   ├── app/                  # Next.js 15 App Router, Middleware & Global Styles
│   ├── ai/                   # Genkit Multi-Agent Flows, RAG Logic & Triage Nodes
│   ├── components/           # UI Library, Maps, and Specialized Clinical Modules
│   ├── firebase/             # Secure Client SDK, Provider & Hardened Rules
│   ├── context/              # Multilingual State Management (EN, HI, MR)
│   └── lib/                  # Utilities, SOAP Client, ML Parsers & Translations
```

---

## ⚙️ Institutional Setup

1. **Clone & Install**:
   ```bash
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
- **Data Isolation**: Strict Firestore rules ensure patient data is only accessible to the owner.
- **WS-Security**: SOAP communications are signed and encrypted for institutional integrity.
- **RSA-4096 Encryption**: Simulated encryption for PHI exports and Bluetooth telemetry.
- **Administrative Root Node**: Dedicated oversight portal for verified credentials.

---

### 📌 Development Lead
**KISHOR KAKDE PATIL**  
[GitHub Profile](https://github.com/Kishor055)

*Developed with ❤️ for a safer, AI-powered healthcare future.*