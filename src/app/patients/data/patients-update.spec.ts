import { TestBed } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { createPatientCreationForm } from '../components/patient-form/patient-creation-form';
import { PatientsMockService } from './patients-mock.service';
import { PATIENTS_PORT } from './patients.port';
import { UpdatePatientRequest } from '../model/patient';
import { planPatientUpdate } from './patient-update-demo';
import { PATIENT_FIXTURES } from './patients.mock';

describe('HU-PAT-001 dummy patient update', () => {
  let store: PatientsMockService;
  const id = PATIENT_FIXTURES[0].id;
  const inactiveId = PATIENT_FIXTURES[2].id;
  beforeEach(() => { store = TestBed.inject(PatientsMockService); });
  const update = (patch: Record<string, unknown>) => store.updatePatient(id, patch as UpdatePatientRequest);

  it('exposes the in-memory adapter through the demo port', () => {
    expect(TestBed.inject(PATIENTS_PORT)).toBe(store);
  });
  it('reads an isolated profile by id and returns undefined for an unknown id', () => {
    const patient = store.getPatient(id)!; patient.name = 'External';
    expect(store.getPatient(id)?.name).toBe(PATIENT_FIXTURES[0].name);
    expect(store.getPatient('missing')).toBeUndefined();
  });
  it('changes only supplied fields, trims input and advances the version once', () => {
    const before = store.getPatient(id)!;
    const result = update({ expectedVersion: 1, name: ' Changed name ' });
    expect(result.ok).toBeTrue();
    if (!result.ok) throw new Error('Update failed');
    expect(result.patient).toEqual({ ...before, name: 'Changed name', version: 2 });
    expect(store.getPatient(id)).toEqual(result.patient);
    expect(PATIENT_FIXTURES[0]).toEqual(before);
  });
  it('retains inactive status, identity and unrelated fields while editing administrative data', () => {
    const before = store.getPatient(inactiveId)!;
    const result = store.updatePatient(inactiveId, { expectedVersion: 1, phone: '301' });
    expect(result.ok).toBeTrue();
    if (!result.ok) throw new Error('Update failed');
    expect(result.patient).toEqual({ ...before, phone: '301', version: 2 });
  });
  it('returns not found without adding a new profile', () => {
    expect(store.updatePatient('missing', { expectedVersion: 1, name: 'Change' }))
      .toEqual({ ok: false, error: 'NOT_FOUND' });
    store.getPatients().subscribe(patients => expect(patients.length).toBe(PATIENT_FIXTURES.length));
  });
  it('rejects stale competing edits and permits retry with the current version', () => {
    expect(update({ expectedVersion: 1, name: 'First' }).ok).toBeTrue();
    expect(update({ expectedVersion: 1, phone: '301' })).toEqual({ ok: false, error: 'STALE_VERSION' });
    expect(store.getPatient(id)?.phone).toBe(PATIENT_FIXTURES[0].phone);
    expect(update({ expectedVersion: 2, phone: '301' }).ok).toBeTrue();
    expect(store.getPatient(id)?.version).toBe(3);
  });
  for (const expectedVersion of [undefined, 0, -1, 1.5, NaN, Infinity]) {
    it(`rejects invalid expectedVersion ${String(expectedVersion)}`, () => {
      expect(update({ expectedVersion, name: 'Change' })).toEqual({ ok: false, error: 'INVALID_UPDATE' });
      expect(store.getPatient(id)?.version).toBe(1);
    });
  }
  it('requires an actual change rather than only a version or unchanged values', () => {
    for (const patch of [{ expectedVersion: 1 }, { expectedVersion: 1, name: ' Ana Demo ' }]) {
      expect(update(patch)).toEqual({ ok: false, error: 'INVALID_UPDATE' });
    }
    expect(store.getPatient(id)?.version).toBe(1);
  });
  for (const field of ['id', 'status', 'version', 'createdAt', 'updatedAt', 'clinicalNotes', 'updatedBy']) {
    it(`rejects protected/unknown ${field} without partially updating`, () => {
      expect(update({ expectedVersion: 1, name: 'Changed', [field]: 'forged' }))
        .toEqual({ ok: false, error: 'INVALID_UPDATE' });
      expect(store.getPatient(id)?.name).toBe('Ana Demo');
    });
  }
  it('rejects blank, overlong and malformed administrative values', () => {
    for (const patch of [{ name: ' ' }, { documentNumber: 'x'.repeat(51) }, { phone: 'x'.repeat(41) },
      { address: '' }, { email: 'invalid' }, { birthDate: '2020-02-30' }, { birthDate: '2999-01-01' },
      { emergencyContacts: null }, { phone: 123 }]) {
      expect(update({ expectedVersion: 1, ...patch })).toEqual({ ok: false, error: 'INVALID_UPDATE' });
    }
    expect(store.getPatient(id)?.version).toBe(1);
  });
  it('rejects a normalized document collision with an inactive patient', () => {
    expect(update({ expectedVersion: 1, documentType: ' cc ', documentNumber: ' 1000000003 ' }))
      .toEqual({ ok: false, error: 'DOCUMENT_EXISTS' });
    expect(store.getPatient(id)?.documentNumber).toBe('1000000001');
  });
  it('permits keeping the same document while changing another field', () => {
    expect(update({ expectedVersion: 1, documentNumber: '1000000001', name: 'Changed' }).ok).toBeTrue();
  });
  it('clones multiple contacts and clears them explicitly with an empty array', () => {
    const contacts = [{ name: ' Contact ', relationship: ' Parent ', phone: ' 300 ' },
      { name: 'Second', relationship: 'Sibling', phone: '301' }];
    const result = update({ expectedVersion: 1, emergencyContacts: contacts });
    if (!result.ok) throw new Error('Update failed');
    expect(result.patient.emergencyContacts?.[0]).toEqual({ name: 'Contact', relationship: 'Parent', phone: '300' });
    contacts[0].name = 'Caller mutation'; result.patient.emergencyContacts![0].name = 'Result mutation';
    expect(store.getPatient(id)?.emergencyContacts?.[0].name).toBe('Contact');
    expect(update({ expectedVersion: 2, emergencyContacts: [] }).ok).toBeTrue();
    expect(store.getPatient(id)?.emergencyContacts).toEqual([]);
  });
  it('rejects incomplete contacts or extra contact properties', () => {
    for (const contact of [{ name: 'Contact', phone: '300' },
      { name: 'Contact', relationship: 'x'.repeat(81), phone: '300' },
      { name: 'Contact', relationship: 'Parent', phone: '300', clinicalNotes: 'forged' }]) {
      expect(update({ expectedVersion: 1, emergencyContacts: [contact] }))
        .toEqual({ ok: false, error: 'INVALID_UPDATE' });
    }
  });
  it('notifies list subscribers after success but not after a rejected update', () => {
    const versions: number[] = [];
    const subscription = store.getPatients().subscribe(patients => versions.push(patients.find(p => p.id === id)!.version));
    update({ expectedVersion: 1, name: 'Changed' }); update({ expectedVersion: 1, phone: '301' });
    expect(versions).toEqual([1, 2]); subscription.unsubscribe();
  });
  for (const [key, limit] of [['documentType', 30], ['documentNumber', 50], ['name', 255], ['phone', 40], ['address', 500]] as const) {
    it(`enforces the ${key} update boundary without changing omitted fields`, () => {
      const before = store.getPatient(id)!;
      expect(update({ expectedVersion: 1, [key]: 'x'.repeat(limit + 1) }).ok).toBeFalse();
      expect(store.getPatient(id)).toEqual(before);
      const result = update({ expectedVersion: 1, [key]: 'x'.repeat(limit) });
      if (!result.ok) throw new Error('Update failed');
      expect(result.patient).toEqual({ ...before, [key]: 'x'.repeat(limit), version: 2 });
    });
  }
  it('rejects malformed runtime request shapes and an invalid mixed patch atomically', () => {
    for (const request of [null, undefined, [], { expectedVersion: 1, name: 'Changed', phone: 123 }]) {
      expect(store.updatePatient(id, request as unknown as UpdatePatientRequest))
        .toEqual({ ok: false, error: 'INVALID_UPDATE' });
      expect(store.getPatient(id)?.name).toBe('Ana Demo');
    }
  });
  it('validates every required contact value and its length', () => {
    const contact = { name: 'Contact', relationship: 'Parent', phone: '300' };
    for (const [key, limit] of [['name', 255], ['relationship', 80], ['phone', 40]] as const) {
      for (const value of [' ', 'x'.repeat(limit + 1)]) {
        expect(update({ expectedVersion: 1, emergencyContacts: [{ ...contact, [key]: value }] }).ok).toBeFalse();
      }
    }
    for (const value of [[null], ['invalid'], {}]) {
      expect(update({ expectedVersion: 1, emergencyContacts: value }).ok).toBeFalse();
    }
    expect(store.getPatient(id)?.version).toBe(1);
  });
  it('requires a contact change regardless of object property order', () => {
    const contact = { name: 'Contact', relationship: 'Parent', phone: '300' };
    expect(update({ expectedVersion: 1, emergencyContacts: [contact] }).ok).toBeTrue();
    expect(update({ expectedVersion: 2, emergencyContacts: [{ phone: '300', name: 'Contact', relationship: 'Parent' }] }))
      .toEqual({ ok: false, error: 'INVALID_UPDATE' });
    expect(store.getPatient(id)?.version).toBe(2);
  });
  it('does not treat clearing an already absent contact list as a change', () => {
    expect(update({ expectedVersion: 1, emergencyContacts: [] })).toEqual({ ok: false, error: 'INVALID_UPDATE' });
  });
  it('keeps nested reads and subscriber snapshots isolated', () => {
    const subscription = store.getPatients().subscribe(patients => {
      const patient = patients.find(p => p.id === id)!; patient.name = 'Observer mutation';
      if (patient.emergencyContacts) patient.emergencyContacts[0].name = 'Observer contact';
    });
    update({ expectedVersion: 1, emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] });
    const read = store.getPatient(id)!; read.emergencyContacts![0].name = 'Read mutation';
    expect(store.getPatient(id)?.name).toBe('Ana Demo');
    expect(store.getPatient(id)?.emergencyContacts?.[0].name).toBe('Contact');
    subscription.unsubscribe();
  });
  it('uses document type and number together and does not invent email uniqueness', () => {
    expect(update({ expectedVersion: 1, documentType: 'PP', documentNumber: '1000000003',
      email: PATIENT_FIXTURES[1].email }).ok).toBeTrue();
  });
  it('accepts a past birth date without requiring unrelated missing read fields', () => {
    expect(store.getPatient(id)?.birthDate).toBeUndefined();
    expect(update({ expectedVersion: 1, birthDate: '2000-02-29' }).ok).toBeTrue();
    expect(store.getPatient(id)?.birthDate).toBe('2000-02-29');
  });
  it('plans without mutating the current profile and preserves existing audit metadata', () => {
    const current = { ...PATIENT_FIXTURES[0], createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-02-01T00:00:00Z' };
    const before = structuredClone(current);
    const result = planPatientUpdate(current, { expectedVersion: 1, name: 'Changed' }, [current]);
    expect(current).toEqual(before);
    if (!result.ok) throw new Error('Update failed');
    expect(result.patient.createdAt).toBe(current.createdAt);
    expect(result.patient.updatedAt).toBe(current.updatedAt);
    result.patient.name = 'External';
    expect(current.name).toBe(before.name);
  });
  it('tracks versions independently for each patient', () => {
    expect(update({ expectedVersion: 1, name: 'Changed' }).ok).toBeTrue();
    expect(store.updatePatient(PATIENT_FIXTURES[1].id, { expectedVersion: 1, phone: '301' }).ok).toBeTrue();
    expect(store.getPatient(id)?.version).toBe(2);
    expect(store.getPatient(PATIENT_FIXTURES[1].id)?.version).toBe(2);
  });
  for (const [key, limit] of [['name', 255], ['relationship', 80], ['phone', 40]] as const) {
    it(`accepts the exact ${key} contact limit after rejecting an excess`, () => {
      const contact = { name: 'Contact', relationship: 'Parent', phone: '300' };
      expect(update({ expectedVersion: 1, emergencyContacts: [{ ...contact, [key]: 'x'.repeat(limit + 1) }] }).ok).toBeFalse();
      const result = update({ expectedVersion: 1, emergencyContacts: [{ ...contact, [key]: 'x'.repeat(limit) }] });
      if (!result.ok) throw new Error('Update failed');
      expect(result.patient.emergencyContacts![0][key].length).toBe(limit);
    });
  }
  it('uses the current Bogota day when validating an update', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date('2026-10-11T04:55:00Z'));
      expect(update({ expectedVersion: 1, birthDate: '2026-10-10' }).ok).toBeFalse();
      jasmine.clock().mockDate(new Date('2026-10-11T05:05:00Z'));
      expect(update({ expectedVersion: 1, birthDate: '2026-10-10' }).ok).toBeTrue();
    } finally { jasmine.clock().uninstall(); }
  });
  it('tracks changes to the same email validator used by creation', () => {
    spyOn(Validators, 'email').and.returnValue({ email: true });
    const creation = createPatientCreationForm(); creation.controls.email.setValue('new@example.com');
    expect(creation.controls.email.invalid).toBeTrue();
    expect(update({ expectedVersion: 1, email: 'new@example.com' }))
      .toEqual({ ok: false, error: 'INVALID_UPDATE' });
  });
});
