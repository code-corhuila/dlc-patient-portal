import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
} from '@angular/core';

import { PatientView } from '../../model/patient';
import { PatientListItem, toPatientListItem } from '../../model/patient-list-item';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListComponent {
  rows: PatientListItem[] = [];
  @Input() editable = false;
  @Input() deactivatable = false;
  readonly deactivate = output<string>();
  readonly edit = output<string>();

  @Input() set patients(patients: PatientView[]) {
    this.rows = patients.map(toPatientListItem);
  }
}
