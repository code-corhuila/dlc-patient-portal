import { TestBed } from '@angular/core/testing';
import { PatientFormComponent } from './patient-form.component';

describe('PatientFormComponent contract', () => {
  const valid = { documentType: 'CC', documentNumber: '123', name: 'Test Patient',
    birthDate: '2000-01-01', phone: '3001234567', email: 'test@example.com' };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PatientFormComponent] }).compileComponents();
  });
  it('requires all six CreatePatient fields', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    component.form.patchValue(valid);
    for (const field of Object.keys(valid)) {
      const control = component.form.get(field)!;
      const previous = control.value;
      control.setValue('');
      expect(component.form.valid).withContext(field).toBeFalse();
      control.setValue(previous);
    }
  });
  it('rejects impossible and future birth dates', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    component.form.patchValue(valid);
    for (const birthDate of ['2000-02-30', '2999-01-01']) {
      component.form.controls.birthDate.setValue(birthDate);
      expect(component.form.valid).toBeFalse();
    }
  });
  it('emits only trimmed administrative fields without status', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    const save = jasmine.createSpy('save');
    component.save.subscribe(save);
    component.form.patchValue({ ...valid, name: '  Test Patient  ' });
    component.submit();
    expect(save).toHaveBeenCalledOnceWith(valid);
  });
  it('enforces contract lengths and complete optional contacts', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    component.form.patchValue(valid);
    component.form.controls.documentNumber.setValue('x'.repeat(51));
    expect(component.form.valid).toBeFalse();
    component.form.controls.documentNumber.setValue('123');
    component.form.controls.emergencyName.setValue('Contact');
    expect(component.form.valid).toBeFalse();
    component.form.patchValue({ emergencyRelationship: 'Parent', emergencyPhone: '300' });
    expect(component.form.valid).toBeTrue();
  });
  it('loads initial data for reuse and emits cancellation', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('initialValue', valid);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.name.value).toBe(valid.name);
    const cancel = jasmine.createSpy('cancel');
    fixture.componentInstance.cancel.subscribe(cancel);
    fixture.nativeElement.querySelector('.cancel-button').click();
    expect(cancel).toHaveBeenCalled();
  });
  it('asks before discarding dirty input and resolves pending leave on destruction', async () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.detectChanges();
    expect(await fixture.componentInstance.canLeave()).toBeTrue();
    fixture.componentInstance.form.markAsDirty();
    const leave = fixture.componentInstance.canLeave();
    fixture.nativeElement.querySelector('[data-keep]').click();
    expect(await leave).toBeFalse();
    const pending = fixture.componentInstance.canLeave();
    fixture.destroy();
    expect(await pending).toBeFalse();
  });
  it('preserves multiple emergency contacts when reusing initial data', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    const contacts = [ { name: 'First', relationship: 'Parent', phone: '300' },
      { name: 'Second', relationship: 'Sibling', phone: '301' } ];
    fixture.componentRef.setInput('initialValue', { ...valid, emergencyContacts: contacts });
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit();
    expect(save).toHaveBeenCalledWith({ ...valid, emergencyContacts: contacts });
  });
  it('includes additional contacts even when the optional first contact is empty', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    component.form.patchValue(valid);
    component.addContact();
    component.form.controls.additionalContacts.at(0).setValue({ name: 'Contact', relationship: 'Parent', phone: '300' });
    const save = jasmine.createSpy(); component.save.subscribe(save);
    component.submit();
    expect(save).toHaveBeenCalledWith({ ...valid, emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] });
  });
  it('clears the previous profile and contacts when initialValue becomes null', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('initialValue', { ...valid,
      emergencyContacts: [{ name: 'First', relationship: 'Parent', phone: '300' },
        { name: 'Second', relationship: 'Parent', phone: '301' }] });
    fixture.componentInstance.form.markAsDirty();
    fixture.componentRef.setInput('initialValue', null);
    expect(fixture.componentInstance.form.controls.name.value).toBe('');
    expect(fixture.componentInstance.form.controls.additionalContacts.length).toBe(0);
    expect(fixture.componentInstance.form.pristine).toBeTrue();
  });
  it('blocks save and leave while the parent reports a pending operation', async () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('busy', true);
    fixture.componentInstance.form.patchValue(valid);
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit();
    expect(save).not.toHaveBeenCalled();
    expect(await fixture.componentInstance.canLeave()).toBeFalse();
  });
  it('marks errors, focuses the summary and emits no invalid request', () => {
    const fixture = TestBed.createComponent(PatientFormComponent); fixture.detectChanges();
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBeTrue();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-error-summary]'));
    expect(fixture.nativeElement.querySelector('#patient-name').getAttribute('aria-invalid')).toBe('true');
  });
  it('shares a pending leave decision and accepts explicit discard', async () => {
    const fixture = TestBed.createComponent(PatientFormComponent); fixture.detectChanges();
    fixture.componentInstance.form.markAsDirty();
    const first = fixture.componentInstance.canLeave();
    expect(fixture.componentInstance.canLeave()).toBe(first);
    fixture.componentInstance.answerLeave(true);
    expect(await first).toBeTrue();
    expect(fixture.nativeElement.querySelector('dialog').open).toBeFalse();
  });
  it('treats Escape on the leave dialog as keep editing', async () => {
    const fixture = TestBed.createComponent(PatientFormComponent); fixture.detectChanges();
    fixture.componentInstance.form.markAsDirty();
    const leave = fixture.componentInstance.canLeave();
    fixture.nativeElement.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(await leave).toBeFalse();
  });
  it('shows parent-owned failure and supports a corrected retry', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('failure', 'Duplicate demo document'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Duplicate demo document');
    fixture.componentInstance.form.patchValue(valid);
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit();
    expect(save).toHaveBeenCalledOnceWith(valid);
  });
  it('blocks resubmission and permits leaving after parent-confirmed success', async () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('saved', true);
    fixture.componentInstance.form.patchValue(valid); fixture.componentInstance.form.markAsDirty();
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit();
    expect(save).not.toHaveBeenCalled();
    expect(await fixture.componentInstance.canLeave()).toBeTrue();
  });
  it('rejects incomplete or overlong additional contacts and trims a complete contact', () => {
    const component = TestBed.createComponent(PatientFormComponent).componentInstance;
    component.form.patchValue(valid); component.addContact();
    const save = jasmine.createSpy(); component.save.subscribe(save);
    component.submit(); expect(save).not.toHaveBeenCalled();
    component.form.controls.additionalContacts.at(0).setValue({ name: 'Contact', relationship: 'x'.repeat(81), phone: '300' });
    component.submit(); expect(save).not.toHaveBeenCalled();
    component.form.controls.additionalContacts.at(0).setValue({ name: ' Contact ', relationship: ' Parent ', phone: ' 300 ' });
    component.submit();
    expect(save).toHaveBeenCalledWith({ ...valid, emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] });
  });  it('does not mutate initial data or retain emitted request references', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    const original = { ...valid, emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] };
    fixture.componentRef.setInput('initialValue', original);
    fixture.componentInstance.save.subscribe(request => { request.name = 'External change'; request.emergencyContacts![0].name = 'External contact'; });
    fixture.componentInstance.submit();
    expect(original.name).toBe(valid.name);
    expect(original.emergencyContacts[0].name).toBe('Contact');
    expect(fixture.componentInstance.form.controls.name.value).toBe(valid.name);
    expect(fixture.componentInstance.form.controls.emergencyName.value).toBe('Contact');
  });
  it('replaces an earlier profile without leaking optional values', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('initialValue', { ...valid, address: 'Old address',
      emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] });
    fixture.componentRef.setInput('initialValue', { ...valid, name: 'Another patient' });
    expect(fixture.componentInstance.form.controls.name.value).toBe('Another patient');
    expect(fixture.componentInstance.form.controls.address.value).toBe('');
    expect(fixture.componentInstance.form.controls.emergencyName.value).toBe('');
    expect(fixture.componentInstance.form.pristine).toBeTrue();
  });
  it('removes additional contacts without including them in the emitted payload', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentInstance.form.patchValue(valid); fixture.componentInstance.addContact(); fixture.detectChanges();
    fixture.nativeElement.querySelector('fieldset button').click();
    expect(fixture.componentInstance.form.dirty).toBeTrue();
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit();
    expect(save).toHaveBeenCalledOnceWith(valid);
  });
  it('disables submission while busy and restores it for a retry', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentInstance.form.patchValue(valid); fixture.componentRef.setInput('busy', true); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('#patient-name').readOnly).toBeTrue();
    fixture.componentRef.setInput('busy', false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBeFalse();
    const save = jasmine.createSpy(); fixture.componentInstance.save.subscribe(save);
    fixture.componentInstance.submit(); expect(save).toHaveBeenCalledOnceWith(valid);
  });
  it('renders the caller title and associates labels and errors with each field', () => {
    const fixture = TestBed.createComponent(PatientFormComponent);
    fixture.componentRef.setInput('title', 'Edit patient'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Edit patient');
    for (const field of fixture.componentInstance.fields) {
      const input = fixture.nativeElement.querySelector('#patient-' + field.key);
      expect(fixture.nativeElement.querySelector('label[for="' + input.id + '"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('#' + input.getAttribute('aria-describedby'))).not.toBeNull();
    }
  });
  for (const [key, limit] of [['name', 255], ['relationship', 80], ['phone', 40]] as const) {
    it(`applies the approved ${key} boundary to every additional contact`, () => {
      const component = TestBed.createComponent(PatientFormComponent).componentInstance;
      component.form.patchValue(valid); component.addContact();
      const contact = component.form.controls.additionalContacts.at(0);
      contact.setValue({ name: 'Contact', relationship: 'Parent', phone: '300' });
      contact.controls[key].setValue('x'.repeat(limit));
      expect(component.form.valid).toBeTrue();
      contact.controls[key].setValue('x'.repeat(limit + 1));
      expect(component.form.valid).toBeFalse();
    });
  }
});
