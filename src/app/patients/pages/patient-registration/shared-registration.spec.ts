import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PatientRegistrationComponent } from './patient-registration.component';
import { PatientFormComponent } from '../../components/patient-form/patient-form.component';
import { PATIENTS_PORT } from '../../data/patients.port';
import { PatientsMockService } from '../../data/patients-mock.service';

describe('HU-PAT-001 shared registration form integration', () => {
  it('uses the bound port and shared create form for multiple contacts without protected fields', () => {
    const register = jasmine.createSpy('register').and.returnValue({ ok: false, error: 'DOCUMENT_EXISTS' });
    TestBed.configureTestingModule({ providers: [{ provide: PATIENTS_PORT, useValue: { register } }] });
    const fixture = TestBed.createComponent(PatientRegistrationComponent); fixture.detectChanges();
    const directStore = spyOn(TestBed.inject(PatientsMockService), 'register');
    const child = fixture.debugElement.query(By.directive(PatientFormComponent))?.componentInstance as PatientFormComponent;
    expect(child).toBeDefined(); if (!child) throw new Error('Shared patient form missing');
    expect(child.mode).toBe('create');
    child.form.patchValue({ documentType: 'CC', documentNumber: '2000000001', name: ' New Demo ',
      birthDate: '1990-01-15', phone: '3000000004', email: 'new@example.com' });
    for (const name of ['Contact One', 'Contact Two']) {
      child.addContact(); child.form.controls.additionalContacts.at(-1).setValue({ name, relationship: 'Family', phone: '300' });
    }
    child.submit(); fixture.detectChanges();
    const request = register.calls.mostRecent().args[0];
    expect(request.name).toBe('New Demo'); expect(request.emergencyContacts.length).toBe(2);
    expect(Object.keys(request).sort()).toEqual(['birthDate', 'documentNumber', 'documentType', 'email', 'emergencyContacts', 'name', 'phone']);
    expect(directStore).not.toHaveBeenCalled(); expect(fixture.nativeElement.textContent).toContain('ya existe');
  });
  it('delegates one pending leave decision and resolves it safely on destruction', async () => {
    const fixture = TestBed.createComponent(PatientRegistrationComponent); fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(PatientFormComponent))?.componentInstance as PatientFormComponent;
    expect(child).toBeDefined(); if (!child) throw new Error('Shared patient form missing');
    child.form.markAsDirty();
    const pending = fixture.componentInstance.canLeave();
    expect(fixture.componentInstance.canLeave()).toBe(pending);
    child.answerLeave(false); expect(await pending).toBeFalse();
    const forced = fixture.componentInstance.canLeave(); fixture.destroy(); expect(await forced).toBeFalse();
  });
  it('permits navigation immediately after registration before child inputs refresh', async () => {
    const fixture = TestBed.createComponent(PatientRegistrationComponent); fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(PatientFormComponent)).componentInstance as PatientFormComponent;
    child.form.patchValue({ documentType: 'CC', documentNumber: 'NEW', name: 'New Demo',
      birthDate: '1990-01-15', phone: '300', email: 'new@example.com' }); child.form.markAsDirty();
    let leave!: Promise<boolean>;
    fixture.componentInstance.registered.subscribe(() => { leave = fixture.componentInstance.canLeave(); });
    child.submit(); expect(await leave).toBeTrue();
  });
});
