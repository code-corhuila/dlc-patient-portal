import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Patient } from '../model/patient';
import { PATIENT_FIXTURES } from './patients.mock';

@Injectable({
  providedIn: 'root',
})
export class PatientsMockService {
  getPatients(): Observable<Patient[]> {
    return of([...PATIENT_FIXTURES]);
  }
}