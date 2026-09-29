/**
 * HealthAI PRO — Core Clinical & Medical Entity Types
 * Defines data structures for medical documents, medication schedules, vitals, and audit logs.
 */

export type DocumentType = 
  | 'prescription'
  | 'lab_report'
  | 'imaging_report'
  | 'discharge_summary'
  | 'vaccination_record'
  | 'clinical_note'
  | 'invoice';

export type DocumentProcessingStatus = 
  | 'uploaded'
  | 'validated'
  | 'ocr_completed'
  | 'entity_extracted'
  | 'indexed'
  | 'failed';

export interface MedicalDocument {
  id: string;
  patientId: string;
  type: DocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  status: DocumentProcessingStatus;
  pages: number;
  ocrStatus: 'pending' | 'completed' | 'failed' | 'not_applicable';
  indexed: boolean;
  uploadedAt: string;
  processedAt?: string;
  summary?: string;
  extractedEntities?: {
    medications?: string[];
    labValues?: Record<string, { value: string; unit: string; referenceRange?: string; status?: 'normal' | 'low' | 'high' }>;
    diagnoses?: string[];
    physicianName?: string;
    facilityName?: string;
  };
  rawText?: string;
  chunksCount?: number;
}

export type MedicationTimeSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';
export type DoseStatus = 'taken' | 'pending' | 'upcoming' | 'missed';

export interface MedicationScheduleItem {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timeSlot: MedicationTimeSlot;
  scheduledTime: string; // e.g. "08:00 AM"
  status: DoseStatus;
  foodInstruction: string; // e.g. "With meals"
  refillRemaining: number;
  totalQuantity: number;
  dailyDoses: number;
  prescriptionExpiry?: string;
  lastTakenAt?: string;
  linkedDocumentId?: string;
}

export interface VitalsEntry {
  id?: string;
  userId: string;
  date: string;
  timestamp: string;
  heartRate: number;        // bpm (Normal: 60-100)
  systolicBp: number;       // mmHg (Normal: <120)
  diastolicBp: number;      // mmHg (Normal: <80)
  spo2: number;             // % (Normal: 95-100)
  temperature: number;      // °C (Normal: 36.1-37.2)
  bloodGlucose?: number;    // mg/dL (Normal Fasting: 70-99)
  weight?: number;          // kg
  bmi?: number;             // kg/m²
  respiratoryRate?: number; // breaths/min (Normal: 12-20)
  clinicalStabilityScore?: number; // 0-100
  notes?: string;
}

export interface DrugInteractionWarning {
  drugs: [string, string];
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  mechanism: string;
  clinicalAction: string;
  sourceCitation: string;
  category: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userRole?: string;
  action: 
    | 'DOCUMENT_UPLOAD'
    | 'DOCUMENT_VIEW'
    | 'DOCUMENT_DELETE'
    | 'AI_QUERY'
    | 'MEDICATION_LOG_TAKEN'
    | 'MEDICATION_UPDATE'
    | 'VITALS_RECORDED'
    | 'PHI_EXPORT'
    | 'EMERGENCY_TRIGGER'
    | 'SECURITY_EVENT';
  resourceId?: string;
  timestamp: string;
  ipHash?: string;
  userAgent?: string;
  details?: Record<string, any>;
}
