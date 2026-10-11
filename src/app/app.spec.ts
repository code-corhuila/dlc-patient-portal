import { TestBed } from '@angular/core/testing';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('should mount the patients view at /patient and redirect the root route', () => {
    const patientRoute = routes.find(route => route.path === 'patient');
    const rootRoute = routes.find(route => route.path === '');

    expect(patientRoute?.children?.[0].component).toBeDefined();
    expect(rootRoute?.redirectTo).toBe('patient');
  });
});