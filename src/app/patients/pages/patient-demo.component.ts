import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PatientsPageComponent } from './patients-page/patients-page.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { PatientEditComponent } from './patient-edit/patient-edit.component';

// Fictional Administrator harness only. PortalFrame owns the composed session gate/navigation.
@Component({ selector: 'app-patient-demo', standalone: true,
  imports: [PatientsPageComponent, PatientRegistrationComponent, PatientEditComponent],
  templateUrl: './patient-demo.component.html' })
export class PatientDemoComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly creation = this.route.snapshot.data['creation'] === true;
  readonly editingId = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  @ViewChild(PatientRegistrationComponent) private registration?: PatientRegistrationComponent;
  @ViewChild(PatientEditComponent) private editor?: PatientEditComponent;
  canLeave(): Promise<boolean> { return this.editor?.canLeave() ?? this.registration?.canLeave() ?? Promise.resolve(true); }
  add(): void { void this.router.navigateByUrl('/patient/new'); }
  edit(id: string): void { void this.router.navigateByUrl('/patient/profiles/' + encodeURIComponent(id) + '/edit'); }
  finish(): void { void this.router.navigateByUrl('/patient'); }
}
