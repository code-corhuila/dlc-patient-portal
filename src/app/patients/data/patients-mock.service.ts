import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CreatePatientRequest, Patient, UpdatePatientRequest } from '../model/patient';
import { documentKey, planPatientUpdate, UpdateResult } from './patient-update-demo';
import { PATIENT_FIXTURES } from './patients.mock';
import type { PatientsPort, RegistrationResult } from './patients.port';
import { canDeactivateDemo, DeactivatePatientRequest, DemoActor,
  demoDeactivationError, DemoDeactivationRecord, DemoDeactivationResult } from '../model/patient-deactivation';
import { DemoDeactivationGuards } from './demo-deactivation-guards';

@Injectable({ providedIn: 'root' })
export class PatientsMockService implements PatientsPort {
  private readonly guards = inject(DemoDeactivationGuards);
  private patients: Patient[] = structuredClone([...PATIENT_FIXTURES]);
  private readonly changes = new BehaviorSubject(this.patients);
  private readonly deactivations = new Map<string, DemoDeactivationRecord[]>();
  getDeactivationHistory(id: string, actor: DemoActor): DemoDeactivationRecord[] {
    return canDeactivateDemo(actor) ? structuredClone(this.deactivations.get(id) ?? []) : [];
  }
  deactivatePatient(id: string, request: DeactivatePatientRequest, actor: DemoActor): DemoDeactivationResult {
    const patient = this.patients.find(candidate => candidate.id === id);
    const error = demoDeactivationError(patient, request, actor, this.guards.read(id));
    if (error) return { ok: false, error };
    const record = { reason: request.reason.trim(), actorId: actor.id,
      at: new Date().toISOString(), previousVersion: patient!.version };
    this.deactivations.set(id, [...(this.deactivations.get(id) ?? []), record]);
    this.patients = this.patients.map(candidate => candidate.id === id ?
      { ...candidate, status: 'INACTIVE', version: candidate.version + 1 } : candidate);
    this.changes.next(this.patients);
    return { ok: true };
  }
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
    this.guards.register(patient.id);
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
