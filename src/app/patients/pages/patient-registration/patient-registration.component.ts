import { Component, DestroyRef, ElementRef, EventEmitter, inject, Output, signal, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientsMockService } from '../../data/patients-mock.service';
import { CONTACT_FIELDS, DOCUMENT_TYPE_SUGGESTIONS, FIELD_PLACEHOLDERS, PROFILE_FIELDS, WIDE_FIELDS } from '../../components/patient-form/patient-form-layout';
import { createPatientCreationForm, toPatientCreationRequest } from '../../components/patient-form/patient-creation-form';

@Component({
  selector: 'app-patient-registration', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './patient-registration.component.html',
  styleUrls: ['../../components/patient-form/patient-modal.css', './patient-registration.component.css'],
})
export class PatientRegistrationComponent {
  @ViewChild('leaveDialog') private leaveDialog?: ElementRef<HTMLDialogElement>;
  private leaveDecision?: (allowed: boolean) => void;
  private readonly store = inject(PatientsMockService);
  readonly profileFields = PROFILE_FIELDS;
  readonly contactFields = CONTACT_FIELDS;
  readonly wideFields = WIDE_FIELDS;
  readonly placeholders = FIELD_PLACEHOLDERS;
  readonly documentTypes = DOCUMENT_TYPE_SUGGESTIONS;
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
      this.error.set(this.form.hasError('emergencyContact') ? 'Completa todos los datos del contacto de emergencia o déjalos vacíos.' :
        'Revisa los campos obligatorios, sus límites y que la fecha de nacimiento sea pasada.');
      return;
    }
    const request = toPatientCreationRequest(this.form.getRawValue());
    try {
      const result = this.store.register(request);
      if (!result.ok) { this.error.set('Un paciente con este documento ya existe en la demo.'); return; }
      this.error.set('');
      this.saved.set(true);
      this.registered.emit();
    } catch { this.error.set('La demo no pudo guardar el paciente. Inténtalo de nuevo.'); }
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
