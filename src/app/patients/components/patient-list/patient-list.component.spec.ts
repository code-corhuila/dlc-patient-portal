import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Patient, PatientForCare } from '../../model/patient';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent', () => {
  let fixture: ComponentFixture<PatientListComponent>;
  let component: PatientListComponent;

  const patients: Patient[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      documentType: 'CC',
      documentNumber: '1000000001',
      name: 'Ana Demo',
      phone: '3000000001',
      email: 'ana.demo@example.com',
      status: 'ACTIVE',
      version: 1,
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

  it('renders a care projection without assuming administrative fields exist', () => {
    const carePatient: PatientForCare = {
      id: patients[0].id,
      name: 'Ana Demo',
      status: 'ACTIVE',
      version: 1,
    };
    fixture.componentRef.setInput('patients', [carePatient]);

    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].textContent.trim()).toBe('—');
    expect(cells[1].textContent.trim()).toBe('Ana Demo');
    expect(cells[2].textContent.trim()).toBe('—');
    expect(cells[3].textContent.trim()).toBe('—');
  });
});
