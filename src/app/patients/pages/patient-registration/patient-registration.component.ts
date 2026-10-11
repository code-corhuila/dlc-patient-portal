import { Component, DestroyRef, ElementRef, EventEmitter, inject, Output, signal, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientsMockService } from '../../data/patients-mock.service';
import { clinicToday, isPastBirthDate } from '../../model/patient-registration';

const FIELDS = [
  { key: 'documentType', label: 'Document type', type: 'text', max: 30, required: true },
  { key: 'documentNumber', label: 'Document number', type: 'text', max: 50, required: true },
  { key: 'name', label: 'Full name', type: 'text', max: 255, required: true },
  { key: 'birthDate', label: 'Birth date', type: 'date', max: 0, required: true },
  { key: 'phone', label: 'Phone', type: 'tel', max: 40, required: true },
  { key: 'email', label: 'Email', type: 'email', max: 255, required: true },
  { key: 'address', label: 'Address (optional)', type: 'text', max: 500, required: false },
  { key: 'emergencyName', label: 'Emergency contact name', type: 'text', max: 255, required: false },
  { key: 'emergencyRelationship', label: 'Contact relationship', type: 'text', max: 80, required: false },
  { key: 'emergencyPhone', label: 'Contact phone', type: 'tel', max: 40, required: false },
] as const;
type Controls = Record<typeof FIELDS[number]['key'], FormControl<string>>;

@Component({
  selector: 'app-patient-registration', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './patient-registration.component.html', styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent {
  @ViewChild('leaveDialog') private leaveDialog?: ElementRef<HTMLDialogElement>;
  private leaveDecision?: (allowed: boolean) => void;
  private readonly store = inject(PatientsMockService);
  readonly fields = FIELDS;
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  @Output() readonly registered = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
  readonly form = new FormGroup(Object.fromEntries(FIELDS.map(field => [field.key,
    new FormControl('', { nonNullable: true, validators: [
      ...(field.required ? [Validators.required] : []), Validators.maxLength(field.max || Infinity),
      ...(field.type === 'email' ? [Validators.email] : []),
      ...(field.type === 'date' ? [(control: AbstractControl) => isPastBirthDate(control.value, clinicToday()) ? null : { pastDate: true }] : []),
    ] }),
  ])) as Controls, { validators: (control: AbstractControl) => {
    const values = ['emergencyName', 'emergencyRelationship', 'emergencyPhone']
      .map(key => control.value[key].trim());
    return values.some(Boolean) && values.some(value => !value) ? { emergencyContact: true } : null;
  } });

  constructor() { inject(DestroyRef).onDestroy(() => this.decideLeave(false)); }

  submit(): void {
    if (this.saved()) return;
    Object.values(this.form.controls).forEach(control => control.setValue(control.value.trim()));
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set(this.form.hasError('emergencyContact') ? 'Complete all emergency contact fields or leave them blank.' :
        'Review the required fields, limits and past birth date.');
      return;
    }
    const { address, emergencyName, emergencyRelationship, emergencyPhone, ...required } = this.form.getRawValue();
    const request = { ...required, ...(address ? { address } : {}), ...(emergencyName ? {
      emergencyContacts: [{ name: emergencyName, relationship: emergencyRelationship, phone: emergencyPhone }],
    } : {}) };
    try {
      const result = this.store.register(request);
      if (!result.ok) { this.error.set('A patient with this document already exists in this demo.'); return; }
      this.error.set('');
      this.saved.set(true);
      this.registered.emit();
    } catch { this.error.set('The demo could not save the patient. Try again.'); }
  }

  canLeave(): Promise<boolean> {
    if (!this.form.dirty || this.saved()) return Promise.resolve(true);
    if (this.leaveDecision) return Promise.resolve(false);
    return new Promise(resolve => {
      this.leaveDecision = resolve;
      this.leaveDialog!.nativeElement.showModal();
    });
  }

  decideLeave(allowed: boolean): void {
    this.leaveDialog?.nativeElement.close();
    this.leaveDecision?.(allowed);
    this.leaveDecision = undefined;
  }
}
