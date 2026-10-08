export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export interface Patient {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: PatientStatus;
}