import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CreatePatientRequest, Patient, UpdatePatientRequest } from '../model/patient';
import { documentKey, planPatientUpdate, UpdateResult } from './patient-update-demo';
import { PATIENT_FIXTURES } from './patients.mock';
import type { PatientsPort, RegistrationResult } from './patients.port';

@Injectable({ providedIn: 'root' })
export class PatientsMockService implements PatientsPort {
  private patients: Patient[] = structuredClone([...PATIENT_FIXTURES]);
  private readonly changes = new BehaviorSubject(this.patients);
  getPatients(): Observable<Patient[]> { return this.changes.pipe(map(patients => structuredClone(patients))); }
  getPatient(id: string): Patient | undefined {
    const patient = this.patients.find(candidate => candidate.id === id);
    return patient ? structuredClone(patient) : undefined;
  }
  register(request: CreatePatientRequest): RegistrationResult {
    const key = documentKey(request.documentType, request.documentNumber);
    if (this.patients.some(patient => documentKey(patient.documentType, patient.documentNumber ?? '') === key)) {
      return { ok: false, error: 'DOCUMENT_EXISTS' };
    }
    const patient: Patient = { ...structuredClone(request), id: crypto.randomUUID(), status: 'ACTIVE', version: 1 };
    this.patients = [...this.patients, patient]; this.changes.next(this.patients);
    return { ok: true, patient: structuredClone(patient) };
  }
  updatePatient(id: string, request: UpdatePatientRequest): UpdateResult {
    const current = this.patients.find(patient => patient.id === id);
    if (!current) return { ok: false, error: 'NOT_FOUND' };
    const result = planPatientUpdate(current, request, this.patients);
    if (!result.ok) return result;
    this.patients = this.patients.map(patient => patient.id === id ? result.patient : patient);
    this.changes.next(this.patients);
    return { ok: true, patient: structuredClone(result.patient) };
  }
}
