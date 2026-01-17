# 🩺 Health CoPilot — AI-Powered Medication Safety Assistant

Health CoPilot is an AI-driven healthcare application designed to reduce medication errors by transforming complex prescriptions into simple, safe, and understandable instructions.
It combines computer vision, large language models, cloud automation, and real-time notifications to improve medication adherence and patient safety.

---

## 🚀 Key Objectives

* Prevent medication errors caused by misinterpretation
* Improve adherence through smart reminders
* Detect unsafe drug combinations
* Provide easy access to nearby healthcare facilities
* Educate users with AI-powered explanations

---

## ✨ Features

### 🔐 Secure Authentication

* Firebase Authentication
* Email/Password and Google Sign-In support

### 📷 Prescription Digitization

* Upload prescription images or manual entry
* OCR using Google ML Kit / Vision API
* Converts unstructured text into structured medicine data

### 🧠 AI-Based Medical Explanation

* Powered by Google Gemini via Genkit
* Simplifies:

  * Dosage instructions
  * Food timing
  * Precautions
  * Basic side effects

### ⚠ Drug Interaction & Safety Alerts

* Detects:

  * Duplicate medicines
  * Overdose risk
  * Known interaction patterns
* Generates prioritized safety alerts
* Alerts stored and displayed prominently

### ⏰ Smart Reminders & Adherence Tracking

* Auto-generated reminder schedules
* Push notifications via Firebase Cloud Messaging (FCM)
* Users can mark doses as Taken or Skipped
* Tracks adherence history

### 💬 Medication Chat Assistant

* In-app AI chatbot
* Answers medicine-related questions only
* Uses active medicine list as context
* Avoids diagnosis and treatment advice

### 🏥 Nearby Hospital & Doctor Finder

* Google Maps & Places API integration
* Shows nearby:

  * Hospitals
  * Clinics
  * Pharmacies
* One-tap call and navigation
* Save favorite hospitals and doctors

### 📞 Emergency Contacts

* Store personal doctor contacts
* Store hospital emergency numbers
* Quick access from dashboard

---

## 🧩 System Architecture

### Frontend

* Next.js (React)
* TypeScript
* Tailwind CSS
* Responsive and mobile-first UI

### Backend & Cloud

* Firebase Authentication
* Cloud Firestore (Database)
* Cloud Functions (Serverless Backend)
* Firebase Cloud Messaging (Notifications)

### AI & APIs

* Google ML Kit / Vision API (OCR)
* Google Gemini API (LLM reasoning & chatbot)
* Genkit (AI workflow orchestration)
* Google Maps & Places API (Healthcare discovery)

---

## 🗄️ Database Structure (Firestore)

**Collections:**

* `users`
* `prescriptions`
* `users/{userId}/medicines`
* `reminders`
* `safetyAlerts`
* `favorites` (doctors / hospitals)
* `chatbotLogs` (optional)

All records are scoped by `userId` to ensure data privacy.

---

## 🔐 Security & Privacy

* All user data is isolated by Firebase Auth UID
* Firestore Security Rules enforce access control
* API keys stored securely in environment variables
* No public access to medical records

> ⚠ Disclaimer: Health CoPilot does not provide medical diagnosis.
> It only offers medication guidance and safety awareness. Users are advised to consult qualified healthcare professionals for medical decisions.

---

## 🛠️ Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/Kishor055/HealthAI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project and enable:

* Authentication
* Firestore
* Cloud Functions
* FCM

Add your Firebase config to:

```
.env.local
```

### 4. Configure APIs

Enable and add keys for:

* Google Vision API / ML Kit
* Gemini API
* Google Maps & Places API

Store all keys securely in environment variables.

### 5. Run Locally

```bash
npm run dev
```

---

## 🧪 MVP Scope

Current MVP focuses on:

* Authentication
* Prescription upload
* OCR extraction
* AI explanation
* Reminders
* Chatbot
* Nearby hospitals

Future versions will expand to:

* Doctor portal
* Appointment booking
* Wearable integration
* Emergency SOS alerts

---

## 📈 Future Enhancements

* Multilingual AI explanations
* Offline reminder support
* Caregiver accounts
* Hospital EMR integration
* Voice-based medicine reminders

---
## 🏆 Use Cases

* Elderly patients managing multiple medications
* Chronic disease patients
* Caregivers monitoring family members
* Rural users with limited access to doctors

---

## 📜 License

This project is developed for educational and hackathon purposes.
All medical guidance should be verified with healthcare professionals.

