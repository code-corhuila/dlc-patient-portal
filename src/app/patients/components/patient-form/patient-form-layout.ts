import { PATIENT_CREATION_FIELDS } from '../../model/patient-creation-contract';

type Field = typeof PATIENT_CREATION_FIELDS[number];
const byKey = (keys: readonly Field['key'][]) => keys.map(key => PATIENT_CREATION_FIELDS.find(field => field.key === key)!);

// Visual order of the "Registrar Nuevo Paciente" mock-up; the contract keeps its own order.
export const PROFILE_FIELDS = byKey(['name', 'documentType', 'documentNumber', 'phone', 'email', 'birthDate', 'address']);
export const CONTACT_FIELDS = byKey(['emergencyName', 'emergencyRelationship', 'emergencyPhone']);
export const WIDE_FIELDS: ReadonlySet<string> = new Set(['name', 'address']);

export const FIELD_PLACEHOLDERS: Readonly<Record<string, string>> = {
  name: 'Juan Pérez',
  documentType: 'CC',
  documentNumber: '1075123456',
  phone: '+573001234567',
  email: 'paciente@email.com',
  address: 'Calle 10 # 15-20, Bogotá',
};

// Suggestions only: the owner contract defines no documentType enum, so any value stays valid.
export const DOCUMENT_TYPE_SUGGESTIONS = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro Civil' },
] as const;
