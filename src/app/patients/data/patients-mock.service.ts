import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CreatePatientRequest, Patient } from '../model/patient';
import { PATIENT_FIXTURES } from './patients.mock';

@Injectable({
  providedIn: 'root',
})
export class PatientsMockService {
  private readonly patients = structuredClone([...PATIENT_FIXTURES]);

  getPatients(): Observable<Patient[]> {
    return of(structuredClone(this.patients));
  }

  register(request: CreatePatientRequest):
    { ok: true; patient: Patient } | { ok: false; error: 'DOCUMENT_EXISTS' } {
    const key = (type: string, number: string) => JSON.stringify([
      type.trim().toUpperCase(), number.trim().toUpperCase(),
    ]);
    if (this.patients.some(patient => key(patient.documentType, patient.documentNumber ?? '') ===
      key(request.documentType, request.documentNumber))) {
      return { ok: false, error: 'DOCUMENT_EXISTS' };
    }
    const patient: Patient = {
      ...structuredClone(request), id: crypto.randomUUID(), status: 'ACTIVE', version: 1,
    };
    this.patients.push(patient);
    return { ok: true, patient: structuredClone(patient) };
  }
}
