import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { PATIENT_CREATION_FIELDS } from '../../model/patient-creation-contract';
import { clinicToday, isPastBirthDate } from '../../model/patient-registration';
export { toPatientCreationRequest } from '../../model/patient-creation-contract';

type Controls = Record<typeof PATIENT_CREATION_FIELDS[number]['key'], FormControl<string>>;
export function createPatientCreationForm(today?: string): FormGroup<Controls> {
  return new FormGroup(Object.fromEntries(PATIENT_CREATION_FIELDS.map(field => [field.key,
    new FormControl('', { nonNullable: true, validators: [
      ...(field.required ? [(control: AbstractControl) => String(control.value).trim() ? null : { required: true }] : []),
      Validators.maxLength(field.max ?? Infinity),
      ...(field.type === 'email' ? [Validators.email] : []),
      ...(field.type === 'date' ? [(control: AbstractControl) => isPastBirthDate(control.value, today ?? clinicToday()) ? null : { pastDate: true }] : []),
    ] }),
  ])) as Controls, { validators: (control: AbstractControl) => {
    const values = ['emergencyName', 'emergencyRelationship', 'emergencyPhone']
      .map(key => String(control.value[key] ?? '').trim());
    return values.some(Boolean) && !values.every(Boolean) ? { emergencyContact: true } : null;
  } });
}
