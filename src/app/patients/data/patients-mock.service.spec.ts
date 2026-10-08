import { TestBed } from '@angular/core/testing';

import { PatientsMockService } from './patients-mock.service';

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
          firstName: jasmine.any(String),
          lastName: jasmine.any(String),
        }),
      );

      done();
    });
  });
});