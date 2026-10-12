import { TestBed } from '@angular/core/testing';
import { PatientsMockService } from './patients-mock.service';
import { PATIENT_FIXTURES } from './patients.mock';
import { DemoDeactivationGuards } from './demo-deactivation-guards';
import contract from '../model/patient-deactivation.contract.json';

describe('HU-PAT-001 dummy deactivation', () => {
  const id = PATIENT_FIXTURES[0].id;
  const actor = { id: 'demo-admin', roles: ['ADMINISTRATOR'] };
  const request = { reason: '  Requested by the patient  ', expectedVersion: 1 };
  const store = () => TestBed.inject(PatientsMockService);
  const records = (adapter = store()) => {
    const result = adapter.getDeactivationHistory(id, actor);
    if (!result.ok) throw new Error('History denied');
    return result.records;
  };
  it('retains every profile field, advances the version and records isolated history', () => {
    const adapter = store(); const before = adapter.getPatient(id)!;
    const snapshots: unknown[] = []; const subscription = adapter.getPatients().subscribe(value => snapshots.push(value));
    expect(adapter.deactivatePatient(id, request, actor)).toEqual({ ok: true });
    expect(adapter.getPatient(id)).toEqual({ ...before, status: 'INACTIVE', version: 2 });
    expect(records(adapter)).toEqual([{ reason: request.reason.trim(), actorId: actor.id,
      at: jasmine.any(String), previousVersion: 1 }]);
    const history = records(adapter); history[0].reason = 'External mutation';
    expect(records(adapter)[0].reason).toBe(request.reason.trim());
    expect(snapshots.length).toBe(2); subscription.unsubscribe();
    expect(PATIENT_FIXTURES[0]).toEqual(before);
    adapter.updatePatient(id, { expectedVersion: 2, phone: '301' });
    expect(records(adapter)[0].previousVersion).toBe(1);
    expect(adapter.getPatient(id)?.status).toBe('INACTIVE');
    expect(adapter.register({ documentType: before.documentType, documentNumber: before.documentNumber!,
      name: 'Duplicate', birthDate: '1990-01-01', phone: '300', email: 'demo@example.com' }).ok).toBeFalse();
  });
  for (const roles of [[], ['SECRETARY_ASSISTANT'], ['DENTIST']]) {
    it(`denies deactivation for ${roles.join() || 'missing role'}`, () => {
      expect(store().deactivatePatient(id, request, { ...actor, roles })).toEqual({ ok: false, error: 'FORBIDDEN' });
      expect(store().getPatient(id)?.status).toBe('ACTIVE');
      store().deactivatePatient(id, request, actor);
      expect(store().getDeactivationHistory(id, { ...actor, roles })).toEqual({ ok: false, error: 'FORBIDDEN' });
    });
  }
  it('rejects empty actor identity, invalid reasons, versions and protected properties atomically', () => {
    const adapter = store(); const before = adapter.getPatient(id);
    expect(adapter.deactivatePatient(id, request, { ...actor, id: '' })).toEqual({ ok: false, error: 'FORBIDDEN' });
    for (const patch of [{ reason: ' ' }, { reason: 'x'.repeat(contract.request.properties.reason.maxLength + 1) }, { expectedVersion: contract.request.properties.expectedVersion.minimum - 1 },
      { expectedVersion: 1.5 }, { status: 'INACTIVE' }]) {
      expect(adapter.deactivatePatient(id, { ...request, ...patch }, actor)).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    }
    expect(adapter.getPatient(id)).toEqual(before); expect(records(adapter)).toEqual([]);
  });
  it('accepts the reason limit and rejects stale or repeated operations without duplicating history', () => {
    const adapter = store();
    expect(adapter.deactivatePatient(id, { ...request, expectedVersion: 2 }, actor)).toEqual({ ok: false, error: 'STALE_VERSION' });
    expect(adapter.deactivatePatient(id, { ...request, reason: 'x'.repeat(contract.request.properties.reason.maxLength) }, actor)).toEqual({ ok: true });
    expect(adapter.deactivatePatient(id, { ...request, expectedVersion: 2 }, actor)).toEqual({ ok: false, error: 'PATIENT_ALREADY_INACTIVE' });
    expect(adapter.deactivatePatient(id, request, actor)).toEqual({ ok: false, error: 'STALE_VERSION' });
    expect(records(adapter).length).toBe(1);
  });
  it('rejects blocked and unavailable dummy guards without changing patients', () => {
    const adapter = store(); const blocked = PATIENT_FIXTURES[1].id;
    expect(adapter.deactivatePatient(blocked, request, actor)).toEqual({ ok: false, error: 'PATIENT_DEACTIVATION_BLOCKED' });
    const registered = adapter.register({ documentType: 'CC', documentNumber: 'NEW', name: 'New Demo',
      birthDate: '1990-01-01', phone: '300', email: 'demo@example.com' });
    if (!registered.ok) throw new Error('Fixture registration failed');
    expect(adapter.deactivatePatient(registered.patient.id, request, actor)).toEqual({ ok: true });
    expect(adapter.getPatient(registered.patient.id)?.status).toBe('INACTIVE');
    spyOn(TestBed.inject(DemoDeactivationGuards), 'read').and.returnValue(undefined);
    expect(adapter.deactivatePatient(id, request, actor)).toEqual({ ok: false, error: 'GUARD_UNAVAILABLE' });
    expect(adapter.getPatient(blocked)?.status).toBe('ACTIVE');
    expect(adapter.getPatient(id)?.status).toBe('ACTIVE');
    expect(adapter.deactivatePatient('missing', request, actor)).toEqual({ ok: false, error: 'NOT_FOUND' });
    expect(adapter.getDeactivationHistory(blocked, actor)).toEqual({ ok: true, records: [] });
  });
});
