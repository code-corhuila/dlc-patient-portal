import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PatientsMockService } from '../../data/patients-mock.service';
import { Patient } from '../../model/patient';
import { PatientsPageComponent } from './patients-page.component';

describe('PatientsPageComponent — HU-PAT-001 contract regression', () => {
  it('passes a minimum administrative profile from its provider to the list', async () => {
    const patient: Patient = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      documentType: 'CC',
      name: 'Minimum administrative profile',
      status: 'INACTIVE',
      version: 1,
    };
    await TestBed.configureTestingModule({
      imports: [PatientsPageComponent],
      providers: [{ provide: PatientsMockService, useValue: { getPatients: () => of([patient]) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientsPageComponent);

    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.textContent).toContain(patient.name);
    expect(row.textContent).toContain('INACTIVE');
    expect(row.querySelector('td').textContent.trim()).toBe('—');
  });
});
