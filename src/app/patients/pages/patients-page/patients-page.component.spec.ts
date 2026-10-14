import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PatientsMockService } from '../../data/patients-mock.service';
import { Patient } from '../../model/patient';
import { PatientsPageComponent } from './patients-page.component';

describe('PatientsPageComponent — HU-PAT-001 mock-up page', () => {
  const minimum: Patient = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    documentType: 'CC',
    name: 'Minimum administrative profile',
    status: 'INACTIVE',
    version: 1,
  };
  const active: Patient = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    documentType: 'TI',
    documentNumber: '1034567890',
    name: 'Andrés López',
    status: 'ACTIVE',
    version: 1,
  };

  async function render(patients: Patient[]) {
    await TestBed.configureTestingModule({
      imports: [PatientsPageComponent],
      providers: [{ provide: PatientsMockService, useValue: { getPatients: () => of(patients) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    return fixture;
  }
  const names = (root: HTMLElement) =>
    [...root.querySelectorAll('[data-name]')].map(node => node.textContent!.trim());
  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('passes a minimum administrative profile from its provider to the list', async () => {
    const fixture = await render([minimum]);

    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.textContent).toContain(minimum.name);
    expect(row.textContent).toContain('Inactivo');
    expect(row.querySelectorAll('td')[1].textContent.trim()).toBe('—');
  });

  it('renders the mock-up header, subtitle and explicit fictional-data notice', async () => {
    const fixture = await render([active]);
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')!.textContent!.trim()).toBe('Gestión de Pacientes');
    expect(root.textContent).toContain('Registro y consulta de expedientes de pacientes en el Consultorio Dental DI-LUCCA');
    expect(root.textContent).toContain('Datos ficticios de demostración');
  });

  it('emits add from the primary Nuevo Paciente action', async () => {
    const fixture = await render([active]);
    const add = jasmine.createSpy('add');
    fixture.componentInstance.add.subscribe(add);

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-new-patient]');
    expect(button.textContent!.trim()).toBe('Nuevo Paciente');
    button.click();

    expect(add).toHaveBeenCalledTimes(1);
  });

  it('filters by name or document from the toolbar search and seeds it from the shell query', async () => {
    const fixture = await render([minimum, active]);
    const root: HTMLElement = fixture.nativeElement;
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
    expect(search.placeholder).toBe('Buscar por nombre, apellido o número de documento...');

    type(search, 'lópez'); fixture.detectChanges();
    expect(names(root)).toEqual(['Andrés López']);
    type(search, '1034567890'); fixture.detectChanges();
    expect(names(root)).toEqual(['Andrés López']);

    fixture.componentRef.setInput('search', 'minimum'); fixture.detectChanges();
    expect(search.value).toBe('minimum');
    expect(names(root)).toEqual([minimum.name]);
  });

  it('restricts the list with the Solo Pacientes Activos toggle', async () => {
    const fixture = await render([minimum, active]);
    const root: HTMLElement = fixture.nativeElement;
    const toggle = root.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    expect(toggle.closest('label')!.textContent!.trim()).toBe('Solo Pacientes Activos');
    expect(names(root).length).toBe(2);

    toggle.click(); fixture.detectChanges();
    expect(names(root)).toEqual(['Andrés López']);

    toggle.click(); fixture.detectChanges();
    expect(names(root).length).toBe(2);
  });
});
