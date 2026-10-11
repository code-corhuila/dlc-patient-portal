import { Component, DestroyRef, ElementRef, EventEmitter, inject, Output, signal, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientsMockService } from '../../data/patients-mock.service';
import { PATIENT_CREATION_FIELDS } from '../../model/patient-creation-contract';
import { createPatientCreationForm, toPatientCreationRequest } from '../../components/patient-form/patient-creation-form';

@Component({
  selector: 'app-patient-registration', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './patient-registration.component.html', styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent {
  @ViewChild('leaveDialog') private leaveDialog?: ElementRef<HTMLDialogElement>;
  private leaveDecision?: (allowed: boolean) => void;
  private readonly store = inject(PatientsMockService);
  readonly fields = PATIENT_CREATION_FIELDS;
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  @Output() readonly registered = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
  readonly form = createPatientCreationForm();

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
    const request = toPatientCreationRequest(this.form.getRawValue());
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
