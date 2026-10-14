import { Component, DestroyRef, ViewChild, inject, output, signal } from '@angular/core';
import { PatientFormComponent } from '../../components/patient-form/patient-form.component';
import { PATIENTS_PORT } from '../../data/patients.port';
import { CreatePatientRequest } from '../../model/patient';

@Component({
  selector: 'app-patient-registration', standalone: true, imports: [PatientFormComponent],
  templateUrl: './patient-registration.component.html',
  styleUrls: ['../../shared/styles/patient-modal.css', './patient-registration.component.css'],
})
export class PatientRegistrationComponent {
  @ViewChild(PatientFormComponent) private formComponent?: PatientFormComponent;
  private readonly patients = inject(PATIENTS_PORT);
  private alive = true;
  readonly saved = signal(false);
  readonly error = signal('');
  readonly registered = output<void>();
  readonly cancelled = output<void>();

  constructor() { inject(DestroyRef).onDestroy(() => { this.alive = false; }); }

  save(request: CreatePatientRequest): void {
    if (!this.alive || this.saved()) return;
    try {
      const result = this.patients.register(request);
      if (!result.ok) { this.error.set('Un paciente con este documento ya existe en la demo.'); return; }
      this.error.set('');
      this.saved.set(true);
      this.registered.emit();
    } catch { this.error.set('La demo no pudo guardar el paciente. Inténtalo de nuevo.'); }
  }

  canLeave(): Promise<boolean> {
    return this.saved() ? Promise.resolve(true) : this.formComponent?.canLeave() ?? Promise.resolve(true);
  }
}
