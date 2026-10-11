import { Component, computed, DestroyRef, inject, signal, ViewEncapsulation } from '@angular/core';
import { PORTAL_CONTEXT } from './shell-contract';
import { PatientsPageComponent } from './patients/pages/patients-page/patients-page.component';

@Component({
  selector: 'dlc-patient-root',
  standalone: true,
  imports: [PatientsPageComponent],
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './portal-frame.html',
  styleUrl: './portal-frame.css',
})
export class PortalFrame {
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

  async returnToPatients(): Promise<void> {
    const revision = this.session().revision;
    try {
      const result = await this.context.navigation.request({ path: '/app/patients' });
      if (this.alive && this.session().revision === revision) {
        this.navigationFailed.set(result.status === 'rejected');
      }
    } catch {
      if (this.alive && this.session().revision === revision) this.navigationFailed.set(true);
    }
  }
}
