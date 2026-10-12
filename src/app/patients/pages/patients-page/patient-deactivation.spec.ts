import { TestBed } from '@angular/core/testing';
import { PatientsPageComponent } from './patients-page.component';
import { PatientsMockService } from '../../data/patients-mock.service';
import { PATIENT_FIXTURES } from '../../data/patients.mock';

describe('Dummy deactivation dialog', () => {
  const render = (roles = ['ADMINISTRATOR']) => {
    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.componentRef.setInput('deactivationActor', { id: 'demo-admin', roles });
    fixture.detectChanges(); return fixture;
  };
  it('deactivates a newly registered patient and refreshes its row and history', () => {
    const adapter = TestBed.inject(PatientsMockService);
    const created = adapter.register({ documentType: 'CC', documentNumber: 'NEW', name: 'New Demo',
      birthDate: '1990-01-01', phone: '300', email: 'demo@example.com' });
    if (!created.ok) throw new Error('Registration failed');
    const fixture = render(); const component = fixture.componentInstance;
    component.openDeactivation(created.patient.id); component.reason = 'Requested by patient';
    component.confirmDeactivation(); fixture.detectChanges();
    const row = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((node: unknown) =>
      (node as HTMLElement).textContent!.includes('New Demo')) as HTMLElement;
    expect(row.querySelector('[data-status]')!.textContent?.trim()).toBe('Inactivo');
    expect(component.deactivationHistory[0].reason).toBe('Requested by patient');
    expect(component.deactivationFailure).toBe('');
  });
  it('opens from a row, validates the reason and displays retained history after success', () => {
    const fixture = render(); const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('[data-deactivate]')!.click(); fixture.detectChanges();
    const dialog = root.querySelector<HTMLDialogElement>('[data-deactivation-dialog]')!;
    expect(dialog.open).toBeTrue();
    fixture.componentInstance.confirmDeactivation(); fixture.detectChanges();
    expect(TestBed.inject(PatientsMockService).getPatient(PATIENT_FIXTURES[0].id)?.status).toBe('ACTIVE');
    fixture.componentInstance.reason = 'Requested by patient';
    fixture.componentInstance.confirmDeactivation(); fixture.detectChanges();
    expect(dialog.textContent).toContain('Requested by patient');
    expect(dialog.textContent).toContain('demo-admin');
    expect(TestBed.inject(PatientsMockService).getPatient(PATIENT_FIXTURES[0].id)?.status).toBe('INACTIVE');
    expect(root.querySelector('[data-status]')!.textContent?.trim()).toBe('Inactivo');
    expect(root.querySelector('[data-deactivate]')!.textContent?.trim()).toBe('Historial');
    fixture.componentInstance.closeDeactivation(); expect(dialog.open).toBeFalse();
  });
  it('hides the action and refuses direct invocation for Assistant and revoked access', () => {
    const fixture = render(['SECRETARY_ASSISTANT']);
    expect(fixture.nativeElement.querySelector('[data-deactivate]')).toBeNull();
    fixture.componentInstance.openDeactivation(PATIENT_FIXTURES[0].id);
    expect(fixture.componentInstance.selectedPatient).toBeUndefined();
    fixture.componentRef.setInput('deactivationActor', { id: 'demo-admin', roles: ['ADMINISTRATOR'] });
    fixture.detectChanges(); fixture.componentInstance.openDeactivation(PATIENT_FIXTURES[0].id);
    fixture.componentRef.setInput('deactivationActor', undefined); fixture.detectChanges();
    fixture.componentInstance.reason = 'Requested'; fixture.componentInstance.confirmDeactivation();
    expect(TestBed.inject(PatientsMockService).getPatient(PATIENT_FIXTURES[0].id)?.status).toBe('ACTIVE');
    expect(fixture.nativeElement.querySelector('[data-deactivation-dialog]').open).toBeFalse();
  });
  it('shows blocked and stale responses without claiming success', () => {
    const fixture = render(); const component = fixture.componentInstance;
    component.openDeactivation(PATIENT_FIXTURES[1].id); component.reason = 'Requested';
    component.confirmDeactivation(); expect(component.deactivationFailure).toContain('bloqueada');
    component.openDeactivation(PATIENT_FIXTURES[0].id); component.reason = 'Requested';
    TestBed.inject(PatientsMockService).updatePatient(PATIENT_FIXTURES[0].id, { expectedVersion: 1, phone: '301' });
    component.confirmDeactivation(); expect(component.deactivationFailure).toContain('cambió');
    component.closeDeactivation(); expect(component.reason).toBe('');
  });
  it('shows unexpected failures and clears drafts when another Administrator signs in', () => {
    const fixture = render(); const component = fixture.componentInstance;
    const adapter = TestBed.inject(PatientsMockService);
    component.openDeactivation(PATIENT_FIXTURES[0].id); component.reason = 'Private draft';
    fixture.componentRef.setInput('deactivationActor', { id: 'other-admin', roles: ['ADMINISTRATOR'] });
    fixture.detectChanges(); expect(component.selectedPatient).toBeUndefined(); expect(component.reason).toBe('');
    spyOn(adapter, 'getPatient').and.throwError('Unavailable');
    component.openDeactivation(PATIENT_FIXTURES[0].id);
    expect(component.deactivationFailure).toContain('no pudo cargar');
    component.closeDeactivation();
  });
  it('distinguishes denied history from an empty history', () => {
    const fixture = render();
    spyOn(TestBed.inject(PatientsMockService), 'getDeactivationHistory').and.returnValue({ ok: false, error: 'FORBIDDEN' });
    fixture.componentInstance.openDeactivation(PATIENT_FIXTURES[2].id); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Acceso al historial denegado');
    expect(fixture.nativeElement.textContent).not.toContain('Sin historial de desactivación');
  });
});
