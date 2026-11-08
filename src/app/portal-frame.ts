import { Component, computed, DestroyRef, inject, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { PatientsApiPage, hasPatientHttp } from './patients/pages/patients-api-page';
import { PORTAL_CONTEXT } from './shell-contract';

/** Composed entry: Patients data comes only from the owner API through the shell HTTP client. */
@Component({
  selector: 'dlc-patient-root',
  standalone: true,
  imports: [PatientsApiPage],
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './portal-frame.html',
  styleUrl: './portal-frame.css',
})
export class PortalFrame {
  @ViewChild(PatientsApiPage) private apiPage?: PatientsApiPage;
  private readonly context = inject(PORTAL_CONTEXT);
  readonly connected = hasPatientHttp(this.context.http);
  readonly route = signal(this.context.route);
  readonly session = signal(this.context.session.getSnapshot());
  readonly accessKey = computed(() => JSON.stringify([this.session().user?.id, this.session().user?.roles, this.session().permissions]));
  private alive = true;

  constructor() {
    const unsubscribe = this.context.session.subscribe(snapshot => { if (this.alive) this.session.set(snapshot); });
    inject(DestroyRef).onDestroy(() => { this.alive = false; unsubscribe(); });
  }

  canLeave(): Promise<boolean> { return this.apiPage?.canLeave() ?? Promise.resolve(true); }
}
