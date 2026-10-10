import { PatientStatus, PatientView } from './patient';

export interface PatientListItem {
  id: string;
  name: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  status: PatientStatus;
}

export function toPatientListItem(patient: PatientView): PatientListItem {
  return {
    id: patient.id,
    name: patient.name,
    documentNumber: 'documentType' in patient ? patient.documentNumber : undefined,
    phone: patient.phone,
    email: patient.email,
    status: patient.status,
  };
}
