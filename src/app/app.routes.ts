import { Routes } from '@angular/router';
import { PATIENTS_ROUTES } from './patients/patients.routes';

export const routes: Routes = [
	{
		path: 'patient',
		children: PATIENTS_ROUTES,
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'patient',
	},
];
