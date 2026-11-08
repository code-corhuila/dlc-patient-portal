import { TestBed } from '@angular/core/testing';
import { PORTAL_CONTEXT, PortalContext, SessionSnapshot } from '../../shell-contract';
import { PatientsApiPage } from './patients-api-page';

describe('Patient owner API through shell HTTP', () => {
  const id = '550e8400-e29b-41d4-a716-446655440001';
  const draft = { documentType: 'CC', documentNumber: '123', name: 'Synthetic Patient',
    birthDate: '2000-01-01', phone: '300', email: 'synthetic@example.invalid' };
  const patient = { ...draft, id, status: 'ACTIVE' as const, version: 3 };
  const page = { data: [patient], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };
  let http: jasmine.Spy; let navigation: jasmine.Spy; let context: PortalContext; let session: SessionSnapshot;
  beforeEach(() => {
    http = jasmine.createSpy().and.callFake(async (input) => ({ ok: true,
      data: input.path.endsWith(id) ? patient : page }));
    navigation = jasmine.createSpy().and.resolveTo({ status: 'applied' });
    session = { state: 'authenticated', revision: 1, reason: null, expiresAt: null,
      permissions: ['patients:read', 'patients:register', 'patients:write'],
      user: { id: 'staff', name: 'Synthetic Staff', roles: ['ADMINISTRATOR'] } };
    context = { contractVersion: 1, portalId: 'patient', mountId: 'test', compositionId: 'test',
      signal: new AbortController().signal, http: { request: http }, reportFailure: () => {},
      navigation: { request: navigation }, session: { getSnapshot: () => session, subscribe: () => () => {} },
      route: { compositionId: 'test', globalPath: '/app/patients', basePath: '/app/patients',
        localPath: '/', query: {}, fragment: '' } };
    TestBed.configureTestingModule({ imports: [PatientsApiPage], providers: [{ provide: PORTAL_CONTEXT, useValue: context }] });
  });
  async function render(path = '/') {
    const fixture = TestBed.createComponent(PatientsApiPage);
    fixture.componentRef.setInput('route', { ...context.route, localPath: path });
    fixture.detectChanges(); await fixture.componentInstance.load(); fixture.detectChanges(); return fixture;
  }
  it('uses protected Gateway paths with server-side search and pagination', async () => {
    const f = await render(); const component = f.componentInstance;
    component.query = 'Synthetic'; component.activeOnly = true; component.page = 2; await component.load();
    expect(http.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ method: 'GET', path: '/api/v1/patients',
      query: { page: ['2'], limit: ['20'], search: ['Synthetic'], status: ['ACTIVE'] } }));
    expect(component.result().data).toEqual([patient]);
    expect(http.calls.allArgs().every(([request]) => !request.headers?.Authorization)).toBeTrue();
  });
  it('keeps a registration key on retry and blocks duplicate in-flight writes', async () => {
    const f = await render('/new'); http.and.resolveTo({ ok: false, status: 503, error: 'SERVICE_UNAVAILABLE' });
    const first = f.componentInstance.save(draft); await f.componentInstance.save(draft); await first;
    const key = http.calls.mostRecent().args[0].headers['Idempotency-Key'];
    expect(http.calls.allArgs().filter(([r]) => r.method === 'POST').length).toBe(1);
    navigation.and.callFake(async () => { expect(await f.componentInstance.canLeave()).toBeTrue(); return { status: 'applied' }; });
    http.and.resolveTo({ ok: true, data: patient }); await f.componentInstance.save(draft);
    expect(http.calls.mostRecent().args[0].headers['Idempotency-Key']).toBe(key);
    expect(navigation).toHaveBeenCalledWith({ path: '/app/patients' });
  });
  it('reads the current version and retains edits on conflict', async () => {
    const f = await render('/profiles/' + id + '/edit');
    http.and.resolveTo({ ok: false, status: 409, error: 'STALE_VERSION' });
    await f.componentInstance.save({ ...draft, phone: '301' });
    expect(http.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ method: 'PATCH',
      path: '/api/v1/patients/' + id, body: { expectedVersion: 3, phone: '301' } }));
    expect(f.componentInstance.failure()).toContain('Recarga'); expect(navigation).not.toHaveBeenCalled();
  });
  it('denies missing permissions and Dentist writes without making requests', async () => {
    session = { ...session, permissions: [] }; const f = await render(); expect(http).not.toHaveBeenCalled();
    session = { ...session, permissions: ['patients:read', 'patients:register'], user: { ...session.user!, roles: ['DENTIST'] } };
    f.componentInstance.creating = true; await f.componentInstance.save(draft);
    expect(http).not.toHaveBeenCalled(); expect(f.componentInstance.allowed('patients:read')).toBeTrue();
  });
  it('cancels pending reads on destruction and never falls back to fixtures', async () => {
    let resolve!: (value: unknown) => void; http.and.returnValue(new Promise(r => { resolve = r; }));
    const f = TestBed.createComponent(PatientsApiPage); f.componentRef.setInput('route', context.route); f.detectChanges();
    const signal = http.calls.mostRecent().args[0].signal; f.destroy();
    resolve({ ok: true, data: page }); await Promise.resolve(); await Promise.resolve();
    expect(signal.aborted).toBeTrue(); expect(f.componentInstance.result().data).toEqual([]);
  });
  it('delegates unsaved confirmation to the shell exactly once', async () => {
    const f = await render('/new'); const component = f.componentInstance;
    const leave = spyOn(component.form!, 'canLeave').and.resolveTo(true);
    navigation.and.callFake(async () => ({ status: await component.canLeave() ? 'applied' : 'cancelled' }));
    await component.navigate(''); expect(leave).toHaveBeenCalledTimes(1);
  });
});
