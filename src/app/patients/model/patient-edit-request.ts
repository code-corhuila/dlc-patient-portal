import { CreatePatientRequest, Patient, UpdatePatientRequest } from './patient';

export function patientEditRequest(current: Patient, draft: CreatePatientRequest): UpdatePatientRequest | null {
  const request: UpdatePatientRequest = { expectedVersion: current.version };
  const keys = ['documentType', 'documentNumber', 'name', 'birthDate', 'phone', 'email', 'address'] as const satisfies readonly (keyof CreatePatientRequest)[];
  for (const key of keys) {
    const raw = draft[key];
    if (raw === undefined && current[key] === undefined) continue;
    if (typeof raw !== 'string') throw new Error('INVALID_UPDATE');
    const value = raw.trim();
    if (!value && current[key] === undefined) continue;
    if (!value) throw new Error('INVALID_UPDATE');
    if (value !== (current[key] ?? '')) Object.assign(request, { [key]: value });
  }
  const canonical = (contacts: CreatePatientRequest['emergencyContacts']) =>
    (contacts ?? []).map(({ name, relationship, phone }) => ({ name, relationship, phone }));
  if (JSON.stringify(canonical(current.emergencyContacts)) !== JSON.stringify(canonical(draft.emergencyContacts))) {
    request.emergencyContacts = structuredClone(draft.emergencyContacts ?? []);
  }
  return Object.keys(request).length > 1 ? request : null;
}
