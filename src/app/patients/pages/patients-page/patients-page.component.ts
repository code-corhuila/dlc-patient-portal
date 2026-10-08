import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsPageComponent {}