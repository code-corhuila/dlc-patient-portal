import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PortalFrame } from './portal-frame';
import { PORTAL_CONTEXT, PortalContext, SessionSnapshot } from './shell-contract';

describe('HU-PAT-001 composed frame on the real Patients API', () => {
  let fixture: ComponentFixture<PortalFrame>;
  let context: PortalContext;
  let snapshot: SessionSnapshot;
  let notify: (value: SessionSnapshot) => void;
  let unsubscribe: jasmine.Spy;
  let http: jasmine.Spy;

  beforeEach(() => {
    snapshot = {
      state: 'authenticated', revision: 1, permissions: ['patients:read'], reason: null,
      user: { id: 'staff-1', name: 'Staff', roles: ['ADMINISTRATOR'] }, expiresAt: '2099-01-01T00:00:00Z',
    };
    unsubscribe = jasmine.createSpy('unsubscribe');
    http = jasmine.createSpy('request').and.resolveTo({ ok: true, data: {
      data: [{ id: '550e8400-e29b-41d4-a716-446655440001', documentType: 'CC', documentNumber: '1000000001',
        name: 'Paciente API', status: 'ACTIVE', version: 1 }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 } } });
    context = {
      contractVersion: 1, portalId: 'patient', mountId: 'mount', compositionId: 'composition',
      signal: new AbortController().signal, http: { request: http }, reportFailure: jasmine.createSpy(),
      route: { compositionId: 'composition', globalPath: '/app/patients',
        basePath: '/app/patients', localPath: '/', query: {}, fragment: '' },
      navigation: { request: jasmine.createSpy('navigate').and.resolveTo({ status: 'applied' }) },
      session: { getSnapshot: () => snapshot, subscribe: (listener: (s: SessionSnapshot) => void) => {
        notify = listener; listener(snapshot); return unsubscribe;
      } },
    };
  });

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({ imports: [PortalFrame],
      providers: [{ provide: PORTAL_CONTEXT, useValue: context }] }).compileComponents();
    fixture = TestBed.createComponent(PortalFrame);
    fixture.detectChanges();
    for (let i = 0; i < 3; i++) { await new Promise(resolve => setTimeout(resolve)); fixture.detectChanges(); }
  }
  const text = () => fixture.nativeElement.shadowRoot.textContent as string;

  it('lists patients through the shell HTTP client', async () => {
    await render();
    expect(http).toHaveBeenCalledWith(jasmine.objectContaining({ method: 'GET', path: '/api/v1/patients' }));
    expect(text()).toContain('Paciente API');
  });

  it('never falls back to fixture data when the shell gives no HTTP client', async () => {
    context = { ...context, http: {} };
    await render();
    expect(text()).toContain('La conexión con la aplicación no está disponible.');
    expect(text()).not.toContain('demostración');
    expect(fixture.nativeElement.shadowRoot.querySelector('app-patient-list')).toBeNull();
  });

  for (const state of ['resolving', 'anonymous', 'expired', 'unavailable'] as const) {
    it(`requests nothing while the session is ${state}`, async () => {
      snapshot = { ...snapshot, state, user: null, permissions: [] };
      await render();
      expect(http).not.toHaveBeenCalled();
    });
  }

  it('stops listening to the session on destruction', async () => {
    await render();
    notify({ ...snapshot, revision: 2 });
    fixture.destroy();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
