import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, Input, OnChanges, ViewChild, inject, output } from '@angular/core';
import { PatientFormComponent } from '../../components/patient-form/patient-form.component';
import { PATIENTS_PORT } from '../../data/patients.port';
import { CreatePatientRequest, Patient } from '../../model/patient';
import { patientEditRequest } from '../../model/patient-edit-request';

@Component({ selector: 'app-patient-edit', standalone: true, imports: [PatientFormComponent],
  templateUrl: './patient-edit.component.html', styleUrl: '../../components/patient-form/patient-modal.css' })
export class PatientEditComponent implements OnChanges, AfterViewInit {
  @Input() patientId = '';
  @Input() allowed = false;
  @ViewChild(PatientFormComponent) formComponent?: PatientFormComponent;
  @ViewChild('modal') private modal?: ElementRef<HTMLDialogElement>;
  private readonly patients = inject(PATIENTS_PORT);
  private readonly changes = inject(ChangeDetectorRef);
  private alive = true;
  readonly finished = output<void>();
  patient?: Patient;
  failure = '';
  saved = false;
  busy = false;
  conflict = false;
  constructor() { inject(DestroyRef).onDestroy(() => { this.alive = false; this.modal?.nativeElement.close(); }); }
  ngAfterViewInit(): void { this.modal?.nativeElement.showModal(); }
  ngOnChanges(): void { this.load(); }
  private load(): void {
    this.changes.markForCheck();
    this.patient = undefined; this.saved = false; this.conflict = false;
    if (!this.allowed || !this.alive) { this.failure = 'La edición administrativa no está disponible para este rol.'; return; }
    try { this.patient = this.patients.getPatient(this.patientId); this.failure = this.patient ? '' : 'Paciente no encontrado.'; }
    catch { this.failure = 'La demo no pudo cargar el paciente.'; }
  }
  async reload(): Promise<void> {
    const id = this.patientId;
    if (await this.canLeave() && this.alive && this.allowed && id === this.patientId) this.load();
  }
  canLeave(): Promise<boolean> { return this.saved ? Promise.resolve(true) : this.formComponent?.canLeave() ?? Promise.resolve(true); }
  private canSave(): boolean { return this.allowed && this.alive && !this.busy && !this.saved; }
  save(draft: CreatePatientRequest): void {
    const current = this.patient; if (!current || !this.canSave()) return;
    if (current.address && !draft.address?.trim()) { this.failure = 'El contrato aprobado no permite borrar la dirección.'; return; }
    try {
      const request = patientEditRequest(current, draft);
      if (!request) { this.failure = 'No hay cambios para guardar.'; return; }
      this.busy = true; this.failure = ''; this.conflict = false;
      const result = this.patients.updatePatient(this.patientId, request);
      if (result.ok) { this.saved = true; this.finished.emit(); }
      else {
        this.conflict = result.error === 'STALE_VERSION';
        this.failure = ({ STALE_VERSION: 'El paciente cambió. Recarga antes de reintentar.', NOT_FOUND: 'Paciente no encontrado.',
          DOCUMENT_EXISTS: 'Ya existe un paciente con este documento.', INVALID_UPDATE: 'Revisa los campos administrativos modificados.' })[result.error];
      }
    } catch { this.failure = 'La demo no pudo actualizar el paciente.'; }
    finally { this.busy = false; this.changes.markForCheck(); }
  }
}
