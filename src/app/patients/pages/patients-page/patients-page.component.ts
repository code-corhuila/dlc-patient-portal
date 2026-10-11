import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  DestroyRef,
  inject,
  Input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientListComponent } from '../../components/patient-list/patient-list.component';
import { PatientsMockService } from '../../data/patients-mock.service';
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
  patients: Patient[] = [];
  @Input() search = '';

  get visiblePatients(): Patient[] {
    const query = this.search.trim().toLowerCase();
    return this.patients.filter(patient => [patient.name, patient.documentNumber ?? '']
      .some(value => value.toLowerCase().includes(query)));
  }

  constructor(
    private readonly patientsService: PatientsMockService,
  ) {}

  ngOnInit(): void {
    this.patientsService
      .getPatients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((patients) => {
        this.patients = patients;
      });
  }
}
