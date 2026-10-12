import { Patient } from './patient';

export interface DeactivatePatientRequest { reason: string; expectedVersion: number; }
export interface DemoActor { id: string; roles: readonly string[]; }
export interface DemoDeactivationRecord { reason: string; actorId: string; at: string; previousVersion: number; }
export type DemoDeactivationError = 'FORBIDDEN' | 'INVALID_REQUEST' | 'NOT_FOUND' | 'STALE_VERSION' |
  'PATIENT_ALREADY_INACTIVE' | 'PATIENT_DEACTIVATION_BLOCKED' | 'GUARD_UNAVAILABLE';
export type DemoDeactivationResult = { ok: true } | { ok: false; error: DemoDeactivationError };
export const canDeactivateDemo = (actor?: DemoActor): boolean =>
  Boolean(actor?.id.trim() && actor.roles.includes('ADMINISTRATOR'));

// Cut 2 fixture states, never authoritative appointment eligibility or owner authorization.
export const DEMO_DEACTIVATION_GUARDS: Readonly<Record<string, 'clear' | 'blocked'>> = {
  '550e8400-e29b-41d4-a716-446655440001': 'clear',
  '550e8400-e29b-41d4-a716-446655440002': 'blocked',
};
export function demoDeactivationError(patient: Patient | undefined, request: DeactivatePatientRequest,
  actor: DemoActor, guard: 'clear' | 'blocked' | undefined): DemoDeactivationError | null {
  if (!canDeactivateDemo(actor)) return 'FORBIDDEN';
  if (!request || typeof request.reason !== 'string' || !request.reason.trim() || request.reason.trim().length > 1000 ||
    !Number.isInteger(request.expectedVersion) || request.expectedVersion < 1 ||
    Object.keys(request).some(key => !['reason', 'expectedVersion'].includes(key))) return 'INVALID_REQUEST';
  if (!patient) return 'NOT_FOUND';
  if (request.expectedVersion !== patient.version) return 'STALE_VERSION';
  if (patient.status === 'INACTIVE') return 'PATIENT_ALREADY_INACTIVE';
  if (guard === undefined) return 'GUARD_UNAVAILABLE';
  return guard === 'blocked' ? 'PATIENT_DEACTIVATION_BLOCKED' : null;
}
