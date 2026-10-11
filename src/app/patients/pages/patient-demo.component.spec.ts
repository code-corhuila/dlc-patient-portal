import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { PATIENT_FIXTURES } from '../data/patients.mock';

describe('Standalone patient editing harness', () => {
  it('opens the selected patient, saves a phone edit and returns to the updated list', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create('/patient');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('[data-edit]')!.click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/patient/profiles/' + PATIENT_FIXTURES[0].id + '/edit');
    expect(harness.routeNativeElement!.querySelector('dialog[open]')).not.toBeNull();
    const phone = harness.routeNativeElement!.querySelector<HTMLInputElement>('#patient-phone')!;
    phone.value = '301'; phone.dispatchEvent(new Event('input'));
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/patient');
    expect(harness.routeNativeElement!.textContent).toContain('301');
    expect(harness.routeNativeElement!.querySelector('app-patient-edit')).toBeNull();
  });
});
