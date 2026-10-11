import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  DestroyRef,
  inject,
  Input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientListComponent } from '../../components/patient-list/patient-list.component';
import { PATIENTS_PORT } from '../../data/patients.port';
import { Patient } from '../../model/patient';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [PatientListComponent],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.css',
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
