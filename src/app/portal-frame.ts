import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { PORTAL_CONTEXT } from './shell-contract';

@Component({
  selector: 'dlc-patient-root',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <main class="dlc-patient-portal">
      @if (route().localPath === '/') {
        <h1>Patient administration</h1>
        <p role="status">Patient integration is not available yet.</p>
      } @else {
        <h1>Page not found.</h1>
      }
    </main>
  `,
})
export class PortalFrame {
  readonly route = signal(inject(PORTAL_CONTEXT).route);
}
