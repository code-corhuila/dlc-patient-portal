import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Patient } from '../../model/patient';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent', () => {
  let fixture: ComponentFixture<PatientListComponent>;
  let component: PatientListComponent;

  const patients: Patient[] = [
    {
      id: 'PAT-DEMO-001',
      documentNumber: '1000000001',
      firstName: 'Ana',
      lastName: 'Demo',
      phone: '3000000001',
      email: 'ana.demo@example.com',
      status: 'ACTIVE',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
  });

  it('should display the provided patients', () => {
    component.patients = patients;

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;

    expect(content).toContain('1000000001');
    expect(content).toContain('Ana');
    expect(content).toContain('Demo');
  });
});