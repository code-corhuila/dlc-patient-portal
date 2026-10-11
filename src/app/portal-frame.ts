import { Component, computed, DestroyRef, inject, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { PatientEditComponent } from './patients/pages/patient-edit/patient-edit.component';
import { PORTAL_CONTEXT } from './shell-contract';
import { PatientsPageComponent } from './patients/pages/patients-page/patients-page.component';
import { PatientRegistrationComponent } from './patients/pages/patient-registration/patient-registration.component';

@Component({
  selector: 'dlc-patient-root',
  standalone: true,
  imports: [PatientsPageComponent, PatientRegistrationComponent, PatientEditComponent],
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './portal-frame.html',
  styleUrl: './portal-frame.css',
})
export class PortalFrame {
  @ViewChild(PatientRegistrationComponent) private registration?: PatientRegistrationComponent;
  @ViewChild(PatientEditComponent) private editor?: PatientEditComponent;
  readonly editId = computed(() => /^\/profiles\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/edit$/i.exec(this.route().localPath)?.[1]);
  private readonly context = inject(PORTAL_CONTEXT);
  private alive = true;
  readonly route = signal(this.context.route);
  readonly session = signal(this.context.session.getSnapshot());
  readonly navigationFailed = signal(false);
  readonly canReadAdministrativeDemo = computed(() => this.session().user?.roles.some(
    role => role === 'ADMINISTRATOR' || role === 'SECRETARY_ASSISTANT',
  ) ?? false);

  constructor() {
    const unsubscribe = this.context.session.subscribe(snapshot => {
      if (!this.alive) return;
      this.session.set(snapshot);
      this.navigationFailed.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.alive = false;
      unsubscribe();
    });
  }

  returnToPatients(): Promise<void> { return this.navigate('/app/patients'); }

  canLeave(): Promise<boolean> { return this.editor?.canLeave() ?? this.registration?.canLeave() ?? Promise.resolve(true); }

  editPatient(id: string): Promise<void> {
    if (this.session().state !== 'authenticated' || !this.canReadAdministrativeDemo()) return Promise.resolve();
    return this.navigate('/app/patients/profiles/' + encodeURIComponent(id) + '/edit');
  }
  async navigate(path: string): Promise<void> {
    const revision = this.session().revision;
    try {
      const result = await this.context.navigation.request({ path });
      if (this.alive && this.session().revision === revision) {
        this.navigationFailed.set(result.status === 'rejected');
      }
    } catch {
      if (this.alive && this.session().revision === revision) this.navigationFailed.set(true);
    }
  }
}
