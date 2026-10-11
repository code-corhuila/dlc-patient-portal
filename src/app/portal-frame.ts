import { Component, computed, DestroyRef, inject, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { PORTAL_CONTEXT } from './shell-contract';
import { PatientsPageComponent } from './patients/pages/patients-page/patients-page.component';
import { PatientRegistrationComponent } from './patients/pages/patient-registration/patient-registration.component';

@Component({
  selector: 'dlc-patient-root',
  standalone: true,
  imports: [PatientsPageComponent, PatientRegistrationComponent],
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './portal-frame.html',
  styleUrl: './portal-frame.css',
})
export class PortalFrame {
  @ViewChild(PatientRegistrationComponent) private registration?: PatientRegistrationComponent;
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

  canLeave(): boolean { return this.registration?.canLeave() ?? true; }

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
