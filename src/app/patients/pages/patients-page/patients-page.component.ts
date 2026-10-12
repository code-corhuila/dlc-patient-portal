import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  DestroyRef,
  inject,
  Input,
  ElementRef,
  ViewChild,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientListComponent } from '../../components/patient-list/patient-list.component';
import { PATIENTS_PORT } from '../../data/patients.port';
import { Patient } from '../../model/patient';
import { canDeactivateDemo, DemoActor, DemoDeactivationRecord } from '../../model/patient-deactivation';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [PatientListComponent],
  templateUrl: './patients-page.component.html',
  styleUrls: ['./patients-page.component.css', '../../components/patient-form/patient-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  patients: Patient[] = [];
  query = '';
  onlyActive = false;
  // The shell's `q` seeds the toolbar search; local typing refines it.
  @Input() set search(value: string) { this.query = value; }
  @Input() editable = false;
  private actor?: DemoActor;
  @Input() set deactivationActor(value: DemoActor | undefined) {
    if (this.actor?.id !== value?.id || !canDeactivateDemo(value)) this.closeDeactivation();
    this.actor = value;
  }
  get canDeactivate(): boolean { return canDeactivateDemo(this.actor); }
  @ViewChild('deactivationDialog') private deactivationDialog?: ElementRef<HTMLDialogElement>;
  selectedPatient?: Patient;
  reason = '';
  deactivationFailure = '';
  deactivationHistory: DemoDeactivationRecord[] = [];
  openDeactivation(id: string): void {
    if (!this.canDeactivate) return;
    this.closeDeactivation();
    try {
      this.selectedPatient = this.patientsService.getPatient(id);
      if (!this.selectedPatient) this.deactivationFailure = 'Paciente no encontrado.';
      else this.deactivationHistory = this.patientsService.getDeactivationHistory(id, this.actor!);
    } catch { this.deactivationFailure = 'La demo no pudo cargar el paciente.'; }
    this.deactivationDialog?.nativeElement.showModal(); this.changeDetector.markForCheck();
  }
  confirmDeactivation(): void {
    if (!this.canDeactivate || !this.selectedPatient) return;
    try {
      const id = this.selectedPatient.id;
      const result = this.patientsService.deactivatePatient(id,
        { reason: this.reason, expectedVersion: this.selectedPatient.version }, this.actor!);
      if (result.ok) {
        this.selectedPatient = this.patientsService.getPatient(id);
        this.deactivationHistory = this.patientsService.getDeactivationHistory(id, this.actor!);
        this.reason = ''; this.deactivationFailure = '';
      } else this.deactivationFailure = ({ FORBIDDEN: 'Operación no permitida.',
        INVALID_REQUEST: 'Ingresa un motivo de 1 a 1000 caracteres.', NOT_FOUND: 'Paciente no encontrado.',
        STALE_VERSION: 'El paciente cambió. Cierra y vuelve a abrir el diálogo.',
        PATIENT_ALREADY_INACTIVE: 'El paciente ya está inactivo.',
        PATIENT_DEACTIVATION_BLOCKED: 'Desactivación bloqueada por la guarda ficticia de citas.',
        GUARD_UNAVAILABLE: 'No se pudo verificar la guarda ficticia; el paciente permanece activo.' })[result.error];
    } catch { this.deactivationFailure = 'La demo no pudo desactivar el paciente.'; }
    this.changeDetector.markForCheck();
  }
  closeDeactivation(): void {
    this.deactivationDialog?.nativeElement.close(); this.selectedPatient = undefined;
    this.reason = ''; this.deactivationFailure = ''; this.deactivationHistory = [];
  }
  readonly edit = output<string>();

  get visiblePatients(): Patient[] {
    const query = this.query.trim().toLowerCase();
    return this.patients.filter(patient => (!this.onlyActive || patient.status === 'ACTIVE') &&
      [patient.name, patient.documentNumber ?? ''].some(value => value.toLowerCase().includes(query)));
  }

  readonly add = output<void>();
  private readonly patientsService = inject(PATIENTS_PORT);

  ngOnInit(): void {
    this.patientsService
      .getPatients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((patients) => {
        this.patients = patients;
        this.changeDetector.markForCheck();
      });
  }
}
