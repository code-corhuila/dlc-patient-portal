import { PatientStatus, PatientView } from './patient';

export interface PatientListItem {
  id: string;
  name: string;
  initials: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: PatientStatus;
}

// Mock-up avatar: first letters of the first and last words of the name.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.map(word => word[0]).join('').toUpperCase();
}

export function toPatientListItem(patient: PatientView): PatientListItem {
  const administrative = 'documentType' in patient ? patient : undefined;
  return {
    id: patient.id,
    name: patient.name,
    initials: initialsOf(patient.name),
    documentType: administrative?.documentType,
    documentNumber: administrative?.documentNumber,
    birthDate: administrative?.birthDate,
    address: administrative?.address,
    phone: patient.phone,
    email: patient.email,
    status: patient.status,
  };
}
