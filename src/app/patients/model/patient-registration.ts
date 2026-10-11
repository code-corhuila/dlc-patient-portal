export type { CreatePatientRequest } from './patient';
export { PATIENT_CREATION_FIELDS as PATIENT_FIELDS } from './patient-creation-contract';

export function clinicToday(): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key)!.value).join('-');
}

export function isPastBirthDate(value: string, today = clinicToday()): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value && value < today;
}
