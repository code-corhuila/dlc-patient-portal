import { InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePatientRequest, Patient, UpdatePatientRequest } from '../model/patient';
import { UpdateResult } from '../model/patient-update';
import { PatientsMockService } from './patients-mock.service';

export type RegistrationResult = { ok: true; patient: Patient } | { ok: false; error: 'DOCUMENT_EXISTS' };
export interface PatientsPort {
  getPatients(): Observable<Patient[]>;
  getPatient(id: string): Patient | undefined;
  register(request: CreatePatientRequest): RegistrationResult;
  updatePatient(id: string, request: UpdatePatientRequest): UpdateResult;
}
// Explicit in-memory demo binding. Owner HTTP integration requires a separate asynchronous port/adapter.
export const PATIENTS_PORT = new InjectionToken<PatientsPort>('patient.demo-data', {
  providedIn: 'root', factory: () => inject(PatientsMockService),
});
