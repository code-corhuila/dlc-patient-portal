import { TestBed } from '@angular/core/testing';
import { PatientEditComponent } from './patient-edit.component';
import { PatientsMockService } from '../../data/patients-mock.service';

describe('HU-PAT-001 patient editing', () => {
  const id = '550e8400-e29b-41d4-a716-446655440001';
  const render = (allowed = true, patientId = id) => {
    const fixture = TestBed.createComponent(PatientEditComponent);
    fixture.componentRef.setInput('allowed', allowed); fixture.componentRef.setInput('patientId', patientId);
    fixture.detectChanges(); return fixture;
  };
  it('loads a partial profile and saves only changed values with its version', () => {
    const fixture = render(); const store = TestBed.inject(PatientsMockService);
    const update = spyOn(store, 'updatePatient').and.callThrough();
    const child = fixture.componentInstance.formComponent!;
    child.form.controls.phone.setValue('301'); child.submit();
    expect(update).toHaveBeenCalledOnceWith(id, { expectedVersion: 1, phone: '301' });
    expect(store.getPatient(id)?.phone).toBe('301');
    expect(fixture.componentInstance.saved).toBeTrue();
  });
  it('does not read protected data or save without presentation permission', () => {
    const store = TestBed.inject(PatientsMockService); const read = spyOn(store, 'getPatient').and.callThrough();
    const fixture = render(false);
    expect(read).not.toHaveBeenCalled(); expect(fixture.nativeElement.querySelector('app-patient-form')).toBeNull();
  });
  it('shows not found without rendering a form', () => {
    const fixture = render(true, 'missing');
    expect(fixture.nativeElement.textContent).toContain('Patient not found');
    expect(fixture.nativeElement.querySelector('app-patient-form')).toBeNull();
  });
  it('rejects unchanged submissions', () => {
    const fixture = render(); const update = spyOn(TestBed.inject(PatientsMockService), 'updatePatient').and.callThrough();
    fixture.componentInstance.save({ documentType: 'CC', documentNumber: '1000000001', name: 'Ana Demo', phone: '3000000001', email: 'ana.demo@example.com', birthDate: '' });
    expect(update).not.toHaveBeenCalled(); expect(fixture.componentInstance.failure).toContain('No changes');
  });
  it('handles conflicts without overwriting the draft and supports explicit reload', async () => {
    const fixture = render(); const store = TestBed.inject(PatientsMockService);
    store.updatePatient(id, { expectedVersion: 1, name: 'External change' });
    fixture.componentInstance.formComponent!.form.controls.name.setValue('My draft');
    fixture.componentInstance.formComponent!.form.markAsDirty();
    fixture.componentInstance.formComponent!.submit(); fixture.detectChanges();
    expect(fixture.componentInstance.failure).toContain('Reload');
    expect(fixture.componentInstance.formComponent!.form.controls.name.value).toBe('My draft');
    const reload = fixture.componentInstance.reload();
    fixture.componentInstance.formComponent!.answerLeave(true); await reload; fixture.detectChanges();
    expect(fixture.componentInstance.formComponent!.form.controls.name.value).toBe('External change');
  });
  it('displays safe store failures and delegates unsaved-leave confirmation', async () => {
    const fixture = render(); spyOn(TestBed.inject(PatientsMockService), 'updatePatient').and.throwError('private failure');
    fixture.componentInstance.formComponent!.form.controls.name.setValue('Changed');
    fixture.componentInstance.formComponent!.form.markAsDirty(); fixture.componentInstance.formComponent!.submit();
    expect(fixture.componentInstance.failure).toBe('The demo could not update the patient.');
    const leave = fixture.componentInstance.canLeave(); fixture.componentInstance.formComponent!.answerLeave(false);
    expect(await leave).toBeFalse(); fixture.destroy();
  });
  it('permits shell leave immediately after success, before child inputs refresh', async () => {
    const fixture = render(); const child = fixture.componentInstance.formComponent!;
    child.form.controls.name.setValue('Changed'); child.form.markAsDirty();
    let leave!: Promise<boolean>;
    fixture.componentInstance.finished.subscribe(() => { leave = fixture.componentInstance.canLeave(); });
    child.submit(); child.answerLeave(false);
    expect(await leave).toBeTrue();
  });
  it('reports unsupported address removal instead of silently retaining it', () => {
    const store = TestBed.inject(PatientsMockService);
    store.updatePatient(id, { expectedVersion: 1, address: 'Existing address' });
    const fixture = render(); const update = spyOn(store, 'updatePatient').and.callThrough();
    fixture.componentInstance.formComponent!.submit();
    fixture.componentInstance.formComponent!.form.controls.address.setValue('');
    fixture.componentInstance.formComponent!.submit();
    expect(update).not.toHaveBeenCalled();
    expect(fixture.componentInstance.failure).toContain('does not support clearing address');
  });
  it('clears contacts explicitly without sending unrelated empty fields', () => {
    const store = TestBed.inject(PatientsMockService);
    store.updatePatient(id, { expectedVersion: 1, emergencyContacts: [{ name: 'Contact', relationship: 'Parent', phone: '300' }] });
    const fixture = render(); const update = spyOn(store, 'updatePatient').and.callThrough();
    const child = fixture.componentInstance.formComponent!;
    child.form.patchValue({ emergencyName: '', emergencyRelationship: '', emergencyPhone: '' }); child.submit();
    expect(update).toHaveBeenCalledOnceWith(id, { expectedVersion: 2, emergencyContacts: [] });
  });
  it('shows a safe read failure without rendering protected fields', () => {
    spyOn(TestBed.inject(PatientsMockService), 'getPatient').and.throwError('private lookup');
    const fixture = render(); expect(fixture.nativeElement.textContent).toContain('could not load');
    expect(fixture.nativeElement.querySelector('app-patient-form')).toBeNull();
  });
  it('ignores retained callbacks after destruction', () => {
    const fixture = render(); const child = fixture.componentInstance.formComponent!;
    const draft = { documentType: 'CC', documentNumber: '1000000001', name: 'Changed', birthDate: '', phone: '300', email: 'ana.demo@example.com' };
    const update = spyOn(TestBed.inject(PatientsMockService), 'updatePatient').and.callThrough();
    fixture.destroy(); fixture.componentInstance.save(draft); expect(update).not.toHaveBeenCalled();
  });
});
