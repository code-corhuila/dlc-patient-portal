import { Routes } from '@angular/router';
import { PatientDemoComponent } from './pages/patient-demo.component';

// Development harness only; these routes are never imported by the composed entry.
const leave = (component: PatientDemoComponent) => component.canLeave();
export const PATIENTS_ROUTES: Routes = [
  { path: 'new', component: PatientDemoComponent, data: { creation: true }, canDeactivate: [leave] },
  { path: 'profiles/:id/edit', component: PatientDemoComponent, canDeactivate: [leave] },
  { path: '', component: PatientDemoComponent },
];
