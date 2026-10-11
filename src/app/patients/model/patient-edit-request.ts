import { CreatePatientRequest, Patient, UpdatePatientRequest } from './patient';
import { PATIENT_CREATION_FIELDS } from './patient-creation-contract';

export function patientEditRequest(current: Patient, draft: CreatePatientRequest): UpdatePatientRequest | null {
  const request: UpdatePatientRequest = { expectedVersion: current.version };
  for (const field of PATIENT_CREATION_FIELDS.filter(field => !field.key.startsWith('emergency'))) {
    const key = field.key as keyof CreatePatientRequest;
    const value = typeof draft[key] === 'string' ? String(draft[key]).trim() : '';
    if (value !== (current[key] ?? '')) Object.assign(request, { [key]: value });
  }
  const canonical = (contacts: CreatePatientRequest['emergencyContacts']) =>
    (contacts ?? []).map(({ name, relationship, phone }) => ({ name, relationship, phone }));
  if (JSON.stringify(canonical(current.emergencyContacts)) !== JSON.stringify(canonical(draft.emergencyContacts))) {
    request.emergencyContacts = structuredClone(draft.emergencyContacts ?? []);
  }
  return Object.keys(request).length > 1 ? request : null;
}
