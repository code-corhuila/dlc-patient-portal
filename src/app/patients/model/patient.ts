export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export interface PatientForCare {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: PatientStatus;
  version: number;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient extends PatientForCare {
  documentType: string;
  documentNumber?: string;
  birthDate?: string;
  address?: string;
  emergencyContacts?: EmergencyContact[];
  createdAt?: string;
  updatedAt?: string;
}

export type PatientView = Patient | PatientForCare;

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PatientPage {
  data: PatientView[];
  meta: PaginatedMeta;
}
