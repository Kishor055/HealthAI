🩺 Health CoPilot

"Next.js" (https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)
"TypeScript" (https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
"Firebase" (https://img.shields.io/badge/Firebase-Cloud_Platform-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
"Google Gemini" (https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
"Build Status" (https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge)

Health CoPilot is an AI-powered medication safety and adherence platform designed to reduce prescription-related errors and improve patient outcomes. By combining Computer Vision, Large Language Models, Cloud Automation, and Smart Notifications, Health CoPilot transforms complex prescriptions into simple, understandable, and actionable medication guidance.

The platform helps patients, caregivers, and healthcare users understand their medications, stay compliant with treatment plans, and receive proactive safety alerts for potential medication risks.

---

📸 Application Preview

🏠 Smart Medication Dashboard

"Health CoPilot Dashboard" (dashboard.png)

Centralized dashboard displaying active medications, safety alerts, adherence statistics, reminders, and emergency healthcare contacts.

📷 Prescription Scanner & AI Explanation

"Prescription OCR" (ocr-preview.png)

Upload prescription images and automatically extract medicine details using OCR and AI-powered interpretation.

💬 AI Medication Assistant

"Medication Chatbot" (chatbot-preview.png)

Interactive AI assistant providing medication guidance, dosage explanations, precautions, and adherence support.

---

🧠 AI-Powered Healthcare Workflow

Health CoPilot uses a multi-stage intelligent processing pipeline to convert prescriptions into actionable healthcare guidance.

graph TD
    User([Patient/User])
    
    User --> Upload[Prescription Upload]
    Upload --> OCR[OCR Engine - Google Vision API / ML Kit]
    
    OCR --> Parser[Medicine Data Parser]
    
    Parser --> AIAgent[Gemini AI Explanation Engine]
    Parser --> SafetyAgent[Drug Safety Agent]
    Parser --> ReminderAgent[Reminder Scheduler]
    
    SafetyAgent --> Alerts[Safety Alerts]
    ReminderAgent --> FCM[Push Notifications]
    
    AIAgent --> Chatbot[Medication Assistant]
    
    Chatbot --> Dashboard[Health CoPilot Dashboard]
    Alerts --> Dashboard
    FCM --> Dashboard
    
    Dashboard --> Maps[Nearby Hospitals & Doctors]
    Dashboard --> Emergency[Emergency Contacts]

---

👥 Core Intelligent Modules

📷 Prescription Processing Engine

Responsible for converting handwritten or printed prescriptions into structured medicine records.

Features

- Prescription image upload
- OCR text extraction
- Medicine identification
- Dosage recognition
- Frequency extraction
- Schedule generation

---

🧠 AI Medication Explanation Engine

Powered by Google Gemini AI through Genkit workflows.

Provides easy-to-understand explanations for:

- Dosage instructions
- Food timing requirements
- Medication purpose
- Precautions
- Common side effects
- Storage recommendations

The AI simplifies complex medical terminology into patient-friendly language.

---

⚠ Drug Safety & Interaction Engine

Analyzes extracted medication data and identifies:

Safety Checks

- Duplicate medications
- Potential overdose risks
- Conflicting schedules
- Drug interaction warnings
- Missed medication risks

Alert Levels

- 🔴 High Risk
- 🟠 Medium Risk
- 🟢 Informational

Safety alerts are prominently displayed inside the dashboard.

---

⏰ Smart Reminder & Adherence Engine

Automatically generates medication schedules based on prescription instructions.

Capabilities

- Reminder generation
- Push notifications
- Dose tracking
- Missed dose detection
- Adherence analytics

Users can mark medicines as:

- ✅ Taken
- ❌ Skipped

---

💬 Medication Chat Assistant

An AI-powered healthcare assistant that answers medication-related questions using the user's active prescription data.

Supported Questions

- When should I take this medicine?
- Can I take it after food?
- What are the common side effects?
- What happens if I miss a dose?

Safety Restrictions

The chatbot:

- Does NOT diagnose diseases
- Does NOT prescribe treatments
- Does NOT replace medical professionals

---

🏥 Healthcare Discovery Module

Integrated with Google Maps and Places API.

Search Nearby

- Hospitals
- Clinics
- Pharmacies
- Doctors

Features

- One-tap navigation
- One-tap calling
- Save favorites
- Emergency access

---

🛠️ Technology Stack

💻 Frontend

Framework

- Next.js
- React
- TypeScript

UI & Styling

- Tailwind CSS
- Responsive Mobile-First Design
- Modern Healthcare UI

---

☁ Backend & Cloud Infrastructure

Firebase Services

- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Firebase Cloud Messaging

Authentication Methods

- Email & Password
- Google Sign-In

---

🧠 Artificial Intelligence

Google Gemini

Used for:

- Medication explanation
- Chat assistant
- Safety summaries

Genkit

Used for:

- AI workflow orchestration
- Prompt management
- Context handling

OCR Services

- Google ML Kit
- Google Vision API

---

🌍 Maps & Location Services

Google Maps Platform

- Maps API
- Places API
- Geocoding API

Used for healthcare facility discovery.

---

🗄️ Firestore Database Architecture

users
│
├── prescriptions
│
├── reminders
│
├── safetyAlerts
│
├── favorites
│
└── chatbotLogs

Collections

users

Stores:

- Profile Information
- Preferences
- Emergency Contacts

prescriptions

Stores:

- Prescription Images
- OCR Results
- AI Summaries

users/{userId}/medicines

Stores:

- Medicine Name
- Dosage
- Frequency
- Timing

reminders

Stores:

- Reminder Schedule
- Notification Status

safetyAlerts

Stores:

- Interaction Warnings
- Duplicate Medication Alerts

favorites

Stores:

- Doctors
- Hospitals
- Pharmacies

chatbotLogs (Optional)

Stores:

- User Conversations
- AI Responses

---

🔐 Security & Privacy

Health CoPilot prioritizes healthcare data protection.

Security Measures

- Firebase UID-based data isolation
- Firestore Security Rules
- Secure API Key Storage
- Environment Variable Protection
- Authenticated Access Only

Privacy Principles

- No public medical records
- User-specific data access
- Secure cloud communication

«⚠ Medical Disclaimer:

Health CoPilot does not provide medical diagnosis, treatment recommendations, or emergency medical advice.
The platform is intended solely for medication guidance, adherence support, and safety awareness.
Always consult qualified healthcare professionals before making medical decisions.»

---

⚙️ Installation & Setup

1️⃣ Clone Repository

git clone https://github.com/Kishor055/HealthAI.git

cd HealthAI

---

2️⃣ Install Dependencies

npm install

---

3️⃣ Configure Firebase

Create a Firebase project and enable:

- Authentication
- Firestore Database
- Cloud Functions
- Cloud Messaging (FCM)

Create:

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

---

4️⃣ Configure AI & External APIs

Enable:

Google Gemini API

GEMINI_API_KEY=

Google Vision API

VISION_API_KEY=

Google Maps Platform

GOOGLE_MAPS_API_KEY=

Places API

GOOGLE_PLACES_API_KEY=

---

5️⃣ Run Development Server

npm run dev

Open:

http://localhost:3000

---

🚀 MVP Features

Current MVP Includes:

- User Authentication
- Prescription Upload
- OCR Extraction
- AI Medication Explanation
- Drug Safety Alerts
- Smart Reminders
- Medication Chatbot
- Nearby Hospital Finder

---

🔮 Future Roadmap

Phase 2

- Multilingual AI Explanations
- Voice-Based Medication Guidance
- Offline Reminder Support
- Caregiver Accounts

Phase 3

- Appointment Booking
- Telemedicine Integration
- Wearable Device Connectivity
- Emergency SOS Alerts

Phase 4

- Electronic Medical Record (EMR) Integration
- Hospital Dashboard
- Doctor Portal
- AI Adherence Prediction

---

📈 Real-World Impact

Health CoPilot benefits:

👵 Elderly Patients

- Medication adherence support
- Simplified instructions

🩺 Chronic Disease Patients

- Long-term treatment tracking
- Safety monitoring

👨‍👩‍👧 Caregivers

- Family medication oversight
- Reminder management

🌍 Rural Communities

- Improved healthcare accessibility
- AI-assisted medication understanding

---

🤝 Contributions

Contributions are welcome.

Development Workflow

1. Fork Repository
2. Create Feature Branch
3. Commit Changes
4. Push Branch
5. Open Pull Request

---

📄 License

This project is developed for educational, research, and hackathon purposes.

Medical guidance generated by AI should always be reviewed and verified by qualified healthcare professionals.

---

👨‍💻 Project Lead

KISHOR KAKDE PATIL

GitHub:
https://github.com/Kishor055

LinkedIn:
https://www.linkedin.com/in/kishor-kakde-patil

---

❤️ Built to Improve Medication Safety & Healthcare Accessibility

Health CoPilot — Transforming Prescriptions into Safe, Simple, and Actionable Healthcare Guidance.