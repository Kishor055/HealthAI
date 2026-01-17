# **App Name**: HealthAI

## Core Features:

- Secure Authentication: Implement secure authentication using Firebase Authentication, supporting email/password login and Google Sign-in.
- Prescription Digitization: Allow users to upload prescription images, extract text using Google ML Kit, and process data into structured medicine records. Persist OCR output and structured data in Firestore.
- AI Interpretation Engine: Translate medical terminology into simple language using Google Gemini API, explaining dosage timing, food instructions, and precautions. Generate concise safety notes. Tool incorporates new information as needed for optimal clarity.
- Drug Interaction & Safety Reasoning: Compare newly added medicines with active user medicines, detect duplicate therapies, and generate prioritized safety alerts with an AI tool to provide best possible recommendation based on new medicine. Safety alerts must be stored and displayed prominently in the UI. Includes overdose risk and known interaction patterns
- Smart Reminders & Adherence Tracking: Automatically generate reminder schedules based on medicine frequency. Deliver notifications via Firebase Cloud Messaging (FCM) for dose reminders and missed dose alerts. Allow users to mark doses as taken or skipped to track adherence.
- Medication Chat Assistant: Provide an in-app chatbot powered by Gemini API that answers medication-specific questions, using the user’s current medicine list as context. Avoid diagnosis and only provide medication guidance.
- Healthcare Facility Discovery: Integrate Google Maps and Places API to detect user location and display nearby hospitals, clinics, and pharmacies. Show name, address, distance, and phone number. Provide navigation and one-tap calling. Allow users to save preferred hospitals and doctors. Also enables manual storage of doctor and hospital contact details
- Build a secure, scalable, AI-powered healthcare application: Build a secure, scalable, AI-powered healthcare application that assists users in managing medications safely by digitizing prescriptions, explaining medical instructions in simple language, detecting drug interactions, sending smart reminders, enabling medication-related conversations, and providing access to nearby healthcare facilities and emergency contacts. The system must prioritize medication safety, adherence, and accessibility.

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) for a calm and trustworthy feel, fitting for a healthcare application.
- Background color: Very light blue (#F0F8FF) for a clean and uncluttered interface.
- Accent color: Muted green (#81C784) to highlight important actions and information, offering a sense of reassurance.
- Body and headline font: 'PT Sans', sans-serif, for clarity and readability across the platform.
- Use clear and recognizable icons to represent different functions and categories within the app, ensuring ease of navigation.
- Implement a bottom-navigation layout for easy access to primary screens, adhering to accessibility and simplicity principles.
- Subtle animations when transitioning between screens to enhance user experience without being distracting.