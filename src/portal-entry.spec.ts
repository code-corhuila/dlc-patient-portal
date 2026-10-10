import { contractVersion, mount, portalId } from './portal-entry';
import { PortalContext, PortalHandle } from './app/shell-contract';

describe('HU-PAT-001 / ADR-011 mount lifecycle', () => {
  let host: HTMLElement;
  let controller: AbortController;
  let context: PortalContext;
  const handles: PortalHandle[] = [];

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    controller = new AbortController();
    context = {
      contractVersion: 1, portalId: 'patient', mountId: crypto.randomUUID(),
      compositionId: crypto.randomUUID(), signal: controller.signal,
      route: {
        compositionId: crypto.randomUUID(), globalPath: '/app/patients',
        basePath: '/app/patients', localPath: '/', query: {}, fragment: '',
      },
      navigation: {}, session: {}, http: {}, reportFailure: jasmine.createSpy('reportFailure'),
    };
  });

  afterEach(async () => {
    for (const handle of handles.splice(0)) await handle.unmount();
    host.remove();
  });

  async function open(): Promise<PortalHandle> {
    const handle = await mount(host, context);
    handles.push(handle);
    return handle;
  }

  it('exports the approved identity without mounting on import', () => {
    expect(portalId).toBe('patient');
    expect(contractVersion).toBe(1);
    expect(host.childElementCount).toBe(0);
    expect(context.reportFailure).not.toHaveBeenCalled();
  });

  it('renders the initial unavailable frame inside the supplied host', async () => {
    const outside = document.createElement('aside');
    document.body.append(outside);
    try {
      const handle = await open();
      const root = host.querySelector('dlc-patient-root')!;
      expect(root.shadowRoot!.textContent).toContain('Patient integration is not available yet.');
      expect(outside.childElementCount).toBe(0);
      expect(await handle.canLeave()).toBeTrue();
      expect(context.reportFailure).not.toHaveBeenCalled();
    } finally { outside.remove(); }
  });

  it('unmounts idempotently without removing the supplied host or foreign content', async () => {
    const handle = await open();
    const foreign = document.createElement('span');
    host.append(foreign);
    await handle.unmount();
    await handle.unmount();
    controller.abort();
    expect(host.isConnected).toBeTrue();
    expect(host.children.length).toBe(1);
    expect(host.firstElementChild).toBe(foreign);
  });

  it('removes the rendered runtime when its mount signal aborts', async () => {
    await open();
    controller.abort();
    expect(host.childElementCount).toBe(0);
  });

  it('rejects an already cancelled mount without rendering', async () => {
    controller.abort();
    await expectAsync(mount(host, context)).toBeRejectedWithError('CANCELLED');
    expect(host.childElementCount).toBe(0);
  });

  it('cleans a mount cancelled while Angular application creation is pending', async () => {
    const pending = mount(host, context);
    controller.abort();
    await expectAsync(pending).toBeRejectedWithError('CANCELLED');
    expect(host.childElementCount).toBe(0);
  });

  it('rejects occupied hosts and incompatible contexts without altering content', async () => {
    host.textContent = 'Shell-owned content';
    await expectAsync(mount(host, context)).toBeRejectedWithError('HOST_NOT_EMPTY');
    expect(host.textContent).toBe('Shell-owned content');
    host.textContent = '';
    await expectAsync(mount(host, { ...context, portalId: 'clinical' }))
      .toBeRejectedWithError('INVALID_CONTEXT');
    await expectAsync(mount(host, { ...context, contractVersion: 2 }))
      .toBeRejectedWithError('INVALID_CONTEXT');
  });

  it('updates local memory without browser navigation and rejects updates after disposal', async () => {
    const handle = await open();
    const before = location.href;
    await handle.updateRoute({ ...context.route, localPath: '/unknown' });
    expect(host.querySelector('dlc-patient-root')!.shadowRoot!.textContent).toContain('Page not found.');
    expect(location.href).toBe(before);
    await handle.unmount();
    await expectAsync(handle.updateRoute(context.route)).toBeRejectedWithError('CANCELLED');
  });
});
