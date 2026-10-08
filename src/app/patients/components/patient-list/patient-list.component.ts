import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import { Patient } from '../../model/patient';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientListComponent {
  @Input() patients: Patient[] = [];
}