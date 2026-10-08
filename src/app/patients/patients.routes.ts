import { Routes } from '@angular/router';

import { PatientsPageComponent } from './pages/patients-page/patients-page.component';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    component: PatientsPageComponent,
  },
];