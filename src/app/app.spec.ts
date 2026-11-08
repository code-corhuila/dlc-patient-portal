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

  it('offers no standalone patient pages outside the shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(routes).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('se ejecuta dentro de dlc-front');
  });
});
