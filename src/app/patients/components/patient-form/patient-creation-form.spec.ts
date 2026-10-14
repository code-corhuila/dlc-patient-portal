import { createPatientCreationForm, toPatientCreationRequest } from './patient-creation-form';

describe('HU-PAT-001 CreatePatient contract', () => {
  const today = '2026-10-11';
  const valid = { documentType: 'CC', documentNumber: '123', name: 'Demo Patient',
    birthDate: '2000-02-29', phone: '3001234567', email: 'demo@example.com', address: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '' };
  const makeForm = () => {
    const form = createPatientCreationForm(today);
    form.setValue(valid);
    return form;
  };

  for (const key of ['documentType', 'documentNumber', 'name', 'birthDate', 'phone', 'email'] as const) {
    it(`requires nonblank ${key}`, () => {
      const form = makeForm();
      form.controls[key].setValue('');
      expect(form.valid).toBeFalse();
      form.controls[key].setValue('   ');
      expect(form.valid).toBeFalse();
    });
  }
  for (const [key, maximum] of [ ['documentType', 30], ['documentNumber', 50], ['name', 255],
    ['phone', 40], ['address', 500] ] as const) {
    it(`accepts the boundary and rejects excess length for ${key}`, () => {
      const form = makeForm();
      form.controls[key].setValue('x'.repeat(maximum));
      expect(form.valid).toBeTrue();
      form.controls[key].setValue('x'.repeat(maximum + 1));
      expect(form.valid).toBeFalse();
    });
  }
  it('enforces the 255-character contract limit independently of email syntax', () => {
    const form = makeForm();
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(58) + '.com';
    expect(email.length).toBe(255);
    form.controls.email.setValue(email);
    expect(form.controls.email.hasError('maxlength')).toBeFalse();
    form.controls.email.setValue(email.replace('d'.repeat(58), 'd'.repeat(57)));
    expect(form.valid).toBeTrue();
    form.controls.email.setValue(email.replace('.com', '.comm'));
    expect(form.controls.email.hasError('maxlength')).toBeTrue();
    for (const value of ['invalid']) {
      form.controls.email.setValue(value);
      expect(form.valid).toBeFalse();
    }
  });
  it('rejects today, future, impossible and malformed birth dates', () => {
    const form = makeForm();
    for (const value of [today, '2026-10-12', '1900-02-29', '2020-02-30', '11/10/2026']) {
      form.controls.birthDate.setValue(value);
      expect(form.valid).withContext(value).toBeFalse();
    }
    form.controls.birthDate.setValue('2000-02-29');
    expect(form.valid).toBeTrue();
  });
  it('accepts document types without inventing an enum', () => {
    const form = makeForm();
    form.controls.documentType.setValue('OTHER_DOCUMENT');
    expect(form.valid).toBeTrue();
  });
  it('allows absent optional fields but requires every supplied contact field', () => {
    const form = makeForm();
    expect(form.valid).toBeTrue();
    form.controls.emergencyName.setValue('Contact');
    expect(form.valid).toBeFalse();
    form.patchValue({ emergencyRelationship: 'Parent', emergencyPhone: '300' });
    expect(form.valid).toBeTrue();
    for (const key of ['emergencyName', 'emergencyRelationship', 'emergencyPhone'] as const) {
      const previous = form.controls[key].value;
      form.controls[key].setValue(' ');
      expect(form.valid).toBeFalse();
      form.controls[key].setValue(previous);
    }
  });
  for (const [key, maximum] of [ ['emergencyName', 255], ['emergencyRelationship', 80],
    ['emergencyPhone', 40] ] as const) {
    it(`validates the optional contact ${key} boundary`, () => {
      const form = makeForm();
      form.patchValue({ emergencyName: 'Contact', emergencyRelationship: 'Parent', emergencyPhone: '300' });
      form.controls[key].setValue('x'.repeat(maximum));
      expect(form.valid).toBeTrue();
      form.controls[key].setValue('x'.repeat(maximum + 1));
      expect(form.valid).toBeFalse();
    });
  }
  it('maps a trimmed allowlist and excludes read-only and clinical data', () => {
    const raw = { ...valid, name: ' Demo Patient ', address: ' ', status: 'INACTIVE',
      id: 'forged', version: 9, clinicalNotes: 'excluded' };
    expect(toPatientCreationRequest(raw)).toEqual({ documentType: 'CC', documentNumber: '123',
      name: 'Demo Patient', birthDate: '2000-02-29', phone: '3001234567', email: 'demo@example.com' });
    expect(toPatientCreationRequest({ ...valid, address: ' Demo address ', emergencyName: ' Contact ',
      emergencyRelationship: ' Parent ', emergencyPhone: ' 300 ' }).emergencyContacts)
      .toEqual([{ name: 'Contact', relationship: 'Parent', phone: '300' }]);
  });
  it('revalidates a form left open across midnight in America/Bogota', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date('2026-10-11T04:55:00Z'));
      const form = createPatientCreationForm();
      form.setValue({ ...valid, birthDate: '2026-10-10' });
      expect(form.valid).toBeFalse();
      jasmine.clock().mockDate(new Date('2026-10-11T05:05:00Z'));
      form.controls.birthDate.updateValueAndValidity();
      expect(form.valid).toBeTrue();
    } finally { jasmine.clock().uninstall(); }
  });});
