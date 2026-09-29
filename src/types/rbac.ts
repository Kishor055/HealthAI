/**
 * HealthAI PRO — Enterprise Role-Based Access Control (RBAC) & Identity Types
 * Strictly governs access permissions across Patient, Doctor, Admin, and Researcher boundaries.
 */

export type UserRole = 'patient' | 'doctor' | 'admin' | 'researcher';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution?: string;
  licenseNumber?: string; // For clinicians/doctors
  assignedPatientIds?: string[]; // For doctors
  authorizedDoctorIds?: string[]; // For patients
  bloodType?: string;
  allergies?: string;
  conditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
}

export interface RolePermissions {
  canViewOwnRecords: boolean;
  canViewAssignedPatients: boolean;
  canManageAllUsers: boolean;
  canAccessAuditLogs: boolean;
  canPrescribeMedications: boolean;
  canAccessAnonymizedResearchData: boolean;
  canExportPHI: boolean;
}

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, RolePermissions> = {
  patient: {
    canViewOwnRecords: true,
    canViewAssignedPatients: false,
    canManageAllUsers: false,
    canAccessAuditLogs: false,
    canPrescribeMedications: false,
    canAccessAnonymizedResearchData: false,
    canExportPHI: true,
  },
  doctor: {
    canViewOwnRecords: true,
    canViewAssignedPatients: true,
    canManageAllUsers: false,
    canAccessAuditLogs: true,
    canPrescribeMedications: true,
    canAccessAnonymizedResearchData: false,
    canExportPHI: true,
  },
  admin: {
    canViewOwnRecords: true,
    canViewAssignedPatients: true,
    canManageAllUsers: true,
    canAccessAuditLogs: true,
    canPrescribeMedications: false,
    canAccessAnonymizedResearchData: true,
    canExportPHI: true,
  },
  researcher: {
    canViewOwnRecords: true,
    canViewAssignedPatients: false,
    canManageAllUsers: false,
    canAccessAuditLogs: false,
    canPrescribeMedications: false,
    canAccessAnonymizedResearchData: true,
    canExportPHI: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS_MATRIX[role]?.[permission] ?? false;
}
