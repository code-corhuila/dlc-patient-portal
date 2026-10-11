import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PatientRegistrationComponent } from './patient-registration.component';
import { PatientsMockService } from '../../data/patients-mock.service';
import { clinicToday } from '../../model/patient-registration';

describe('HU-PAT-001 dummy patient registration', () => {
  let fixture: ComponentFixture<PatientRegistrationComponent>;
  let store: PatientsMockService;
  const valid = { documentType: 'CC', documentNumber: '2000000001', name: 'New Demo',
    birthDate: '1990-01-15', phone: '3000000004', email: 'new@example.com', address: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '' };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PatientRegistrationComponent] }).compileComponents();
    fixture = TestBed.createComponent(PatientRegistrationComponent);
    store = TestBed.inject(PatientsMockService);
    fixture.detectChanges();
  });

  it('submits trimmed data once, omits an empty address and announces demo success', async () => {
    const registered = jasmine.createSpy('registered');
    fixture.componentInstance.registered.subscribe(registered);
    const register = spyOn(store, 'register').and.callThrough();
    fixture.componentInstance.form.setValue({ ...valid, name: ' New Demo ' });
    fixture.componentInstance.form.markAsDirty();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(register.calls.mostRecent().args[0].name).toBe('New Demo');
    expect(register.calls.mostRecent().args[0].address).toBeUndefined();
    expect(register.calls.mostRecent().args[0].emergencyContacts).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('Paciente registrado en la memoria de la demo.');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBeTrue();
    fixture.componentInstance.submit();
    expect(register).toHaveBeenCalledTimes(1);
    expect(registered).toHaveBeenCalledTimes(1);
    expect(await fixture.componentInstance.canLeave()).toBeTrue();
  });

  it('renders the mock-up modal with Spanish labels and actions', () => {
    const root: HTMLElement = fixture.nativeElement;
    const cancelled = jasmine.createSpy('cancelled');
    fixture.componentInstance.cancelled.subscribe(cancelled);

    expect(root.querySelector('[role=dialog] h2')!.textContent!.trim()).toBe('Registrar Nuevo Paciente');
    const label = (key: string) => root.querySelector(`label[for="pat-${key}"] span`)!.textContent!.trim();
    expect(label('name')).toBe('Nombre completo *');
    expect(label('documentType')).toBe('Tipo Documento *');
    expect(label('documentNumber')).toBe('Número Documento *');
    expect(label('phone')).toBe('Teléfono *');
    expect(label('email')).toBe('Correo Electrónico *');
    expect(label('birthDate')).toBe('Fecha de Nacimiento *');
    expect(label('address')).toBe('Dirección de Residencia');
    expect(root.querySelector<HTMLInputElement>('#pat-documentType')!.getAttribute('list')).toBe('pat-document-types');
    expect(root.querySelector('[type=submit]')!.textContent!.trim()).toBe('Guardar Paciente');
    root.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
    root.querySelector<HTMLButtonElement>('[data-close]')!.click();
    expect(cancelled).toHaveBeenCalledTimes(2);
  });

  it('rejects missing, invalid, future and impossible administrative values', () => {
    const register = spyOn(store, 'register').and.callThrough();
    for (const values of [{ ...valid, name: ' ' }, { ...valid, email: 'invalid' },
      { ...valid, birthDate: '2999-01-01' }, { ...valid, birthDate: '2020-02-30' },
      { ...valid, birthDate: clinicToday() },
      { ...valid, documentNumber: '1'.repeat(51) }]) {
      fixture.componentInstance.form.setValue(values);
      fixture.componentInstance.submit();
      expect(fixture.componentInstance.form.invalid).toBeTrue();
    }
    expect(register).not.toHaveBeenCalled();
  });

  it('reports duplicates and unexpected failures safely while permitting a corrected retry', () => {
    fixture.componentInstance.form.setValue({ ...valid, documentNumber: '1000000003' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toContain('ya existe');
    const register = spyOn(store, 'register').and.throwError('Sensitive failure');
    fixture.componentInstance.form.setValue(valid);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).not.toContain('Sensitive failure');
    register.and.callThrough();
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.saved()).toBeTrue();
  });

  it('requires a complete emergency contact and sends only the owner contact shape', () => {
    const register = spyOn(store, 'register').and.callThrough();
    fixture.componentInstance.form.setValue({ ...valid, emergencyName: 'Contact Demo' });
    fixture.componentInstance.submit();
    expect(register).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
    fixture.componentInstance.form.setValue({ ...valid, address: ' Demo address ',
      emergencyName: ' Contact Demo ', emergencyRelationship: 'Family', emergencyPhone: '3000000005' });
    fixture.componentInstance.submit();
    expect(register.calls.mostRecent().args[0].address).toBe('Demo address');
    expect(register.calls.mostRecent().args[0].emergencyContacts).toEqual([
      { name: 'Contact Demo', relationship: 'Family', phone: '3000000005' },
    ]);
  });
});
