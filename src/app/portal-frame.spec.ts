import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { PortalFrame } from './portal-frame';
import { PORTAL_CONTEXT, PortalContext, SessionSnapshot } from './shell-contract';
import { PatientsMockService } from './patients/data/patients-mock.service';

describe('HU-PAT-001 composed dummy navigation and session', () => {
  let fixture: ComponentFixture<PortalFrame>;
  let context: PortalContext;
  let snapshot: SessionSnapshot;
  let notify: (value: SessionSnapshot) => void;
  let unsubscribe: jasmine.Spy;
  let request: jasmine.Spy;
  let getPatients: jasmine.Spy;
  const patient = {
    id: '550e8400-e29b-41d4-a716-446655440001', documentType: 'CC',
    documentNumber: '1000000001', name: 'Scoped dummy patient', status: 'ACTIVE', version: 1,
  };

  beforeEach(async () => {
    snapshot = {
      state: 'authenticated', revision: 1, permissions: [], reason: null,
      user: { id: 'demo-admin', name: 'Demo Administrator', roles: ['ADMINISTRATOR'] },
      expiresAt: '2099-01-01T00:00:00Z',
    };
    unsubscribe = jasmine.createSpy('unsubscribe');
    request = jasmine.createSpy('request').and.resolveTo({ status: 'applied' });
    getPatients = jasmine.createSpy('getPatients').and.returnValue(of([patient]));
    context = {
      contractVersion: 1, portalId: 'patient', mountId: 'mount', compositionId: 'composition',
      signal: new AbortController().signal, http: {}, reportFailure: jasmine.createSpy(),
      route: { compositionId: 'composition', globalPath: '/app/patients',
        basePath: '/app/patients', localPath: '/', query: {}, fragment: '' },
      navigation: { request },
      session: { getSnapshot: () => snapshot, subscribe: (listener: (s: SessionSnapshot) => void) => {
        notify = listener; listener(snapshot); return unsubscribe;
      } },
    };
    await TestBed.configureTestingModule({
      imports: [PortalFrame], providers: [
        { provide: PORTAL_CONTEXT, useValue: context },
        { provide: PatientsMockService, useValue: { getPatients } },
      ],
    }).compileComponents();
  });

  const text = () => fixture.nativeElement.shadowRoot.textContent;
  function render() {
    fixture = TestBed.createComponent(PortalFrame);
    fixture.detectChanges();
  }

  it('renders the explicit dummy list for Administrator and Assistant', () => {
    render();
    expect(text()).toContain(patient.name);
    expect(text()).toContain('fictional patient data');
    notify({ ...snapshot, revision: 2, user: { ...snapshot.user!, roles: ['SECRETARY_ASSISTANT'] } });
    fixture.detectChanges();
    expect(text()).toContain(patient.name);
  });

  for (const state of ['resolving', 'anonymous', 'expired', 'unavailable'] as const) {
    it(`does not load private demo data while session is ${state}`, () => {
      snapshot = { ...snapshot, state, user: null, permissions: [], expiresAt: null };
      render();
      expect(text()).not.toContain(patient.name);
      expect(getPatients).not.toHaveBeenCalled();
    });
  }

  for (const role of ['DENTIST', 'UNKNOWN']) {
    it(`does not expose all administrative fixtures to ${role}`, () => {
      snapshot = { ...snapshot, user: { ...snapshot.user!, roles: [role] } };
      render();
      expect(text()).not.toContain(patient.documentNumber);
      expect(getPatients).not.toHaveBeenCalled();
    });
  }

  it('responds to compositor search query updates and restores the unfiltered list', () => {
    render();
    fixture.componentInstance.route.set({ ...context.route, query: { q: [' NO MATCH '] } });
    fixture.detectChanges();
    expect(text()).toContain('No patients available.');
    fixture.componentInstance.route.set({ ...context.route, query: { q: [' 1000000001 '] } });
    fixture.detectChanges();
    expect(text()).toContain(patient.name);
    fixture.componentInstance.route.set(context.route);
    fixture.detectChanges();
    expect(text()).toContain(patient.name);
  });

  it('removes the list on session invalidation and unsubscribes on destruction', () => {
    render();
    notify({ ...snapshot, state: 'expired', revision: 2, user: null, permissions: [], expiresAt: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.shadowRoot.querySelector('app-patients-page')).toBeNull();
    fixture.destroy();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('delegates 404 recovery to shell navigation without writing browser history', async () => {
    context = { ...context, route: { ...context.route, localPath: '/unknown' } };
    TestBed.overrideProvider(PORTAL_CONTEXT, { useValue: context });
    render();
    const before = location.href;
    fixture.nativeElement.shadowRoot.querySelector('button').click();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledOnceWith({ path: '/app/patients' });
    expect(location.href).toBe(before);
    expect(text()).toContain('Page not found.');
  });

  it('shows a safe navigation failure and clears it after cancellation', async () => {
    render();
    request.and.rejectWith(new Error('Sensitive detail'));
    await fixture.componentInstance.returnToPatients();
    fixture.detectChanges();
    expect(text()).toContain('Navigation could not be applied.');
    expect(text()).not.toContain('Sensitive detail');
    request.and.resolveTo({ status: 'rejected' });
    await fixture.componentInstance.returnToPatients();
    expect(fixture.componentInstance.navigationFailed()).toBeTrue();
    request.and.resolveTo({ status: 'cancelled' });
    await fixture.componentInstance.returnToPatients();
    expect(fixture.componentInstance.navigationFailed()).toBeFalse();
  });

  it('ignores a navigation result after the session changes', async () => {
    render();
    let finish!: (value: { status: 'rejected' }) => void;
    request.and.returnValue(new Promise(resolve => { finish = resolve; }));
    const pending = fixture.componentInstance.returnToPatients();
    notify({ ...snapshot, revision: 2, state: 'anonymous', user: null });
    finish({ status: 'rejected' });
    await pending;
    expect(fixture.componentInstance.navigationFailed()).toBeFalse();
  });

  it('requests registration through the shell and protects an unsaved form', async () => {
    render();
    fixture.nativeElement.shadowRoot.querySelector('button').click();
    await fixture.whenStable();
    expect(request).toHaveBeenCalledOnceWith({ path: '/app/patients/new' });
    fixture.componentInstance.route.set({ ...context.route, localPath: '/new' });
    fixture.detectChanges();
    const input = fixture.nativeElement.shadowRoot.querySelector('#pat-name');
    input.value = 'Unsaved demo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const pending: Promise<boolean> = fixture.componentInstance.canLeave();
    const dialog = fixture.nativeElement.shadowRoot.querySelector('dialog');
    expect(dialog.open).toBeTrue();
    dialog.querySelector('button').click();
    expect(await pending).toBeFalse();
    const forced: Promise<boolean> = fixture.componentInstance.canLeave();
    notify({ ...snapshot, state: 'expired', user: null, revision: 2 });
    fixture.detectChanges();
    expect(fixture.nativeElement.shadowRoot.querySelector('form')).toBeNull();
    expect(await forced).toBeFalse();
    expect(await fixture.componentInstance.canLeave()).toBeTrue();
  });
});
