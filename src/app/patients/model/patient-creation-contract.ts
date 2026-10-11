import { CreatePatientRequest } from './patient';

// Patients OpenAPI CreatePatient: administrative fields only; documentType has no enum.
// Labels are Spanish display text from the dlc-docs mock-up; keys stay the contract identifiers.
export const PATIENT_CREATION_FIELDS = [
  { key: 'documentType', label: 'Tipo Documento', type: 'text', max: 30, required: true },
  { key: 'documentNumber', label: 'Número Documento', type: 'text', max: 50, required: true },
  { key: 'name', label: 'Nombre completo', type: 'text', max: 255, required: true },
  { key: 'birthDate', label: 'Fecha de Nacimiento', type: 'date', max: null, required: true },
  { key: 'phone', label: 'Teléfono', type: 'tel', max: 40, required: true },
  { key: 'email', label: 'Correo Electrónico', type: 'email', max: 255, required: true },
  { key: 'address', label: 'Dirección de Residencia', type: 'text', max: 500, required: false },
  { key: 'emergencyName', label: 'Nombre del contacto', type: 'text', max: 255, required: false },
  { key: 'emergencyRelationship', label: 'Parentesco', type: 'text', max: 80, required: false },
  { key: 'emergencyPhone', label: 'Teléfono del contacto', type: 'tel', max: 40, required: false },
] as const;
export type PatientCreationValues = Record<typeof PATIENT_CREATION_FIELDS[number]['key'], string>;

// Call after form validation. Explicit allowlist excludes status, identity, audit and clinical fields.
export function toPatientCreationRequest(raw: PatientCreationValues): CreatePatientRequest {
  const request: CreatePatientRequest = {
    documentType: raw.documentType.trim(), documentNumber: raw.documentNumber.trim(),
    name: raw.name.trim(), birthDate: raw.birthDate.trim(), phone: raw.phone.trim(), email: raw.email.trim(),
  };
  if (raw.address.trim()) request.address = raw.address.trim();
  if (raw.emergencyName.trim()) request.emergencyContacts = [{ name: raw.emergencyName.trim(),
    relationship: raw.emergencyRelationship.trim(), phone: raw.emergencyPhone.trim() }];
  return request;
}
