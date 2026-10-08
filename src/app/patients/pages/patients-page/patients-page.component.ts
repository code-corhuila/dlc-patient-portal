import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';

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
  patients: Patient[] = [];

  constructor(
    private readonly patientsService: PatientsMockService,
  ) {}

  ngOnInit(): void {
    this.patientsService
      .getPatients()
      .subscribe((patients) => {
        this.patients = patients;
      });
  }
}