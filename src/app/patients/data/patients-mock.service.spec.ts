import { TestBed } from '@angular/core/testing';

import { PatientsMockService } from './patients-mock.service';
import { CreatePatientRequest } from '../model/patient';

describe('PatientsMockService', () => {
  let service: PatientsMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(PatientsMockService);
  });

  it('should return fictional patients', (done) => {
    service.getPatients().subscribe((patients) => {
      expect(patients.length).toBeGreaterThan(0);

      expect(patients[0]).toEqual(
        jasmine.objectContaining({
          id: jasmine.any(String),
          documentNumber: jasmine.any(String),
          documentType: jasmine.any(String),
          name: jasmine.any(String),
          version: jasmine.any(Number),
        }),
      );

      done();
    });
  });

  const request: CreatePatientRequest = {
    documentType: 'CC', documentNumber: '2000000001', name: 'New Demo',
    birthDate: '1990-01-15', phone: '3000000004', email: 'new@example.com',
  };

  it('creates an active identity in this store without mutating fixtures or snapshots', () => {
    const result = service.register(request);
    expect(result.ok).toBeTrue();
    if (!result.ok) throw new Error('Registration failed');
    expect(result.patient.status).toBe('ACTIVE');
    expect(result.patient.version).toBe(1);
    expect(result.patient.id).toMatch(/^[0-9a-f-]{36}$/);
    result.patient.name = 'Changed outside the store';
    service.getPatients().subscribe(patients => {
      expect(patients.find(p => p.id === result.patient.id)?.name).toBe(request.name);
    });
    TestBed.runInInjectionContext(() => new PatientsMockService()).getPatients().subscribe(patients => {
      expect(patients.some(p => p.documentNumber === request.documentNumber)).toBeFalse();
    });
  });

  it('rejects duplicate demo documents, including inactive profiles', () => {
    const result = service.register({ ...request, documentType: ' cc ', documentNumber: ' 1000000003 ' });
    expect(result).toEqual({ ok: false, error: 'DOCUMENT_EXISTS' });
    expect(service.register(request).ok).toBeTrue();
    expect(service.register(request).ok).toBeFalse();
  });
});
