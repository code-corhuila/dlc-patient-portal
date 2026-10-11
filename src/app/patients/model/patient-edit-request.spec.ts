import { CreatePatientRequest, Patient } from './patient';
import { patientEditRequest } from './patient-edit-request';

describe('patient edit PATCH contract', () => {
  const current: Patient = { id: 'demo', name: 'Demo', documentType: 'CC', address: 'Existing', status: 'ACTIVE', version: 2 };
  const draft = { name: 'Changed', documentType: 'CC', address: 'Existing' } as CreatePatientRequest;
  for (const address of ['', '   ', undefined]) {
    it(`rejects address removal (${String(address)}) outside the form`, () => {
      expect(() => patientEditRequest(current, { ...draft, address })).toThrowError('INVALID_UPDATE');
    });
  }
  it('rejects non-string scalar values instead of converting them to empty strings', () => {
    expect(() => patientEditRequest(current, { ...draft, name: 42 } as unknown as CreatePatientRequest)).toThrowError('INVALID_UPDATE');
  });
  it('omits absent read fields and includes only changed allowed fields', () => {
    expect(patientEditRequest(current, draft)).toEqual({ expectedVersion: 2, name: 'Changed' });
  });
});
