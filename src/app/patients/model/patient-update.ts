import { EmergencyContact, Patient, UpdatePatientRequest } from './patient';
import { PATIENT_CREATION_FIELDS } from './patient-creation-contract';
import { isPastBirthDate } from './patient-registration';

export type UpdateResult = { ok: true; patient: Patient } | { ok: false;
  error: 'NOT_FOUND' | 'STALE_VERSION' | 'INVALID_UPDATE' | 'DOCUMENT_EXISTS' };
const invalid = (): UpdateResult => ({ ok: false, error: 'INVALID_UPDATE' });
const fields = PATIENT_CREATION_FIELDS.filter(field => !field.key.startsWith('emergency'));
const allowed = new Set<string>([...fields.map(field => field.key), 'emergencyContacts', 'expectedVersion']);
// Same syntax as the existing Angular email validator; this is a demo policy, not server validation.
const emailPattern = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const documentKey = (type: string, number: string) =>
  JSON.stringify([type.trim().toUpperCase(), number.trim().toUpperCase()]);

function contacts(value: unknown): EmergencyContact[] | null {
  if (!Array.isArray(value)) return null;
  const result: EmergencyContact[] = [];
  const contactFields = [['name', 'emergencyName'], ['relationship', 'emergencyRelationship'], ['phone', 'emergencyPhone']] as const;
  for (const item of value) {
    if (!item || typeof item !== 'object' || Object.keys(item).length !== 3) return null;
    const contact = {} as EmergencyContact;
    for (const [key, source] of contactFields) {
      const text = item[key];
      const max = PATIENT_CREATION_FIELDS.find(field => field.key === source)!.max!;
      if (typeof text !== 'string' || !text.trim() || text.trim().length > max) return null;
      contact[key] = text.trim();
    }
    result.push(contact);
  }
  return result;
}

function administrativeText(key: string, value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const field = fields.find(candidate => candidate.key === key)!;
  const text = value.trim();
  if (!text || text.length > (field.max ?? Infinity)) return null;
  if (key === 'email' && !emailPattern.test(text)) return null;
  if (key === 'birthDate' && !isPastBirthDate(text)) return null;
  return text;
}

function parseChanges(request: UpdatePatientRequest): Partial<Patient> | null {
  const changes: Partial<Patient> = {};
  for (const [key, value] of Object.entries(request)) {
    if (key === 'expectedVersion') continue;
    if (key === 'emergencyContacts') {
      const parsed = contacts(value);
      if (!parsed) return null;
      changes.emergencyContacts = parsed;
      continue;
    }
    const text = administrativeText(key, value);
    if (text === null) return null;
    Object.assign(changes, { [key]: text });
  }
  return changes;
}

// Pure in-memory update planning. Identity/status/audit fields are never writable through this contract.
export function planPatientUpdate(current: Patient, request: UpdatePatientRequest,
  patients: readonly Patient[]): UpdateResult {
  if (!request || typeof request !== 'object' || !Number.isInteger(request.expectedVersion) ||
    request.expectedVersion < 1 || Object.keys(request).some(key => !allowed.has(key))) return invalid();
  if (request.expectedVersion !== current.version) return { ok: false, error: 'STALE_VERSION' };
  const changes = parseChanges(request);
  if (!changes) return invalid();
  const changed = Object.entries(changes).some(([key, value]) => {
    const before = key === 'emergencyContacts' ? (current.emergencyContacts ?? []).map(
      ({ name, relationship, phone }) => ({ name, relationship, phone })) : current[key as keyof Patient];
    return JSON.stringify(before) !== JSON.stringify(value);
  });
  if (!changed) return invalid();
  const candidate = { ...structuredClone(current), ...changes, version: current.version + 1 };
  if (patients.some(patient => patient.id !== current.id && documentKey(patient.documentType, patient.documentNumber ?? '') ===
    documentKey(candidate.documentType, candidate.documentNumber ?? ''))) return { ok: false, error: 'DOCUMENT_EXISTS' };
  return { ok: true, patient: candidate };
}
