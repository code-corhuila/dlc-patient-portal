import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Patient, PatientForCare } from '../../model/patient';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent — HU-PAT-001 mock-up table', () => {
  let fixture: ComponentFixture<PatientListComponent>;
  let component: PatientListComponent;

  const patients: Patient[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      documentType: 'CC',
      documentNumber: '1000000001',
      name: 'Ana Demo',
      birthDate: '1990-05-15',
      address: 'Calle 45 # 12-34',
      phone: '3000000001',
      email: 'ana.demo@example.com',
      status: 'ACTIVE',
      version: 1,
    },
  ];
  const text = (selector: string) =>
    [...fixture.nativeElement.querySelectorAll(selector)].map((node: Element) => node.textContent!.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
  });

  it('renders the mock-up column headers in Spanish', () => {
    component.patients = patients;
    fixture.detectChanges();

    expect(text('thead th')).toEqual(['Paciente', 'Documento', 'Teléfono', 'Correo', 'Fecha nac.', 'Estado']);
  });

  it('renders avatar, name, address, document chip, contact data, birth date and status', () => {
    component.patients = patients;
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.querySelector('[data-avatar]').textContent.trim()).toBe('AD');
    expect(row.querySelector('[data-name]').textContent.trim()).toBe('Ana Demo');
    expect(row.querySelector('[data-address]').textContent.trim()).toBe('Calle 45 # 12-34');
    expect(row.querySelector('[data-document-type]').textContent.trim()).toBe('CC');
    expect(row.querySelector('[data-document-number]').textContent.trim()).toBe('1000000001');
    expect(text('tbody td').slice(2)).toEqual(['3000000001', 'ana.demo@example.com', '1990-05-15', 'Activo']);
  });

  it('labels inactive patients with a distinct Spanish status badge', () => {
    fixture.componentRef.setInput('patients', [{ ...patients[0], status: 'INACTIVE' }]);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('[data-status]');
    expect(badge.textContent.trim()).toBe('Inactivo');
    expect(badge.classList).toContain('status-inactive');
  });

  it('renders a care projection without assuming administrative fields exist', () => {
    const carePatient: PatientForCare = {
      id: patients[0].id,
      name: 'Ana Demo',
      status: 'ACTIVE',
      version: 1,
    };
    fixture.componentRef.setInput('patients', [carePatient]);

    fixture.detectChanges();

    const cells = text('tbody td');
    expect(cells[0]).toContain('Ana Demo');
    expect(fixture.nativeElement.querySelector('[data-address]')).toBeNull();
    expect(cells[1]).toBe('—');
    expect(cells[2]).toBe('—');
    expect(cells[3]).toBe('—');
    expect(cells[4]).toBe('—');
  });

  it('shows a Spanish empty state', () => {
    fixture.componentRef.setInput('patients', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se encontraron pacientes.');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('hides editing by default and emits only the selected id when enabled', () => {
    const fixture = TestBed.createComponent(PatientListComponent);
    fixture.componentRef.setInput('patients', [{ id: 'patient-id', documentType: 'CC', name: 'Patient', status: 'ACTIVE', version: 1 }]);
    fixture.detectChanges(); expect(fixture.nativeElement.querySelector('[data-edit]')).toBeNull();
    fixture.componentRef.setInput('editable', true); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('thead th:last-child').textContent.trim()).toBe('Acciones');
    const button = fixture.nativeElement.querySelector('[data-edit]');
    expect(button.getAttribute('aria-label')).toBe('Editar Patient');
    const edit = jasmine.createSpy(); fixture.componentInstance.edit.subscribe(edit);
    button.click();
    expect(edit).toHaveBeenCalledOnceWith('patient-id');
  });
});
