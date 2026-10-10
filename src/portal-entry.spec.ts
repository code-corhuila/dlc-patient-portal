import { ApplicationRef, ErrorHandler } from '@angular/core';
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
    const destroy = spyOn(ApplicationRef.prototype, 'destroy').and.callThrough();
    const bootstrap = spyOn(ApplicationRef.prototype, 'bootstrap').and.callThrough();
    const pending = mount(host, context);
    controller.abort();
    await expectAsync(pending).toBeRejectedWithError('CANCELLED');
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(bootstrap).not.toHaveBeenCalled();
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

  it('keeps another mounted Angular application alive when disposing this one', async () => {
    const otherHost = document.createElement('div');
    document.body.append(otherHost);
    try {
      const first = await open();
      const second = await mount(otherHost, { ...context, signal: new AbortController().signal });
      handles.push(second);
      await first.unmount();
      await second.updateRoute({ ...context.route, localPath: '/unknown' });
      expect(otherHost.querySelector('dlc-patient-root')!.shadowRoot!.textContent)
        .toContain('Page not found.');
    } finally { otherHost.remove(); }
  });

  it('cleans partial DOM failures and reports only a safe failure code', async () => {
    const removeListener = spyOn(controller.signal, 'removeEventListener').and.callThrough();
    spyOn(host, 'append').and.throwError('Sensitive internal failure');

    await expectAsync(mount(host, context)).toBeRejectedWithError('PORTAL_MOUNT_FAILED');

    expect(host.childElementCount).toBe(0);
    expect(removeListener).toHaveBeenCalled();
    expect(context.reportFailure).toHaveBeenCalledOnceWith({ code: 'PORTAL_RENDER_FAILED' });
  });

  it('destroys a created application if root bootstrap fails', async () => {
    const destroy = spyOn(ApplicationRef.prototype, 'destroy').and.callThrough();
    spyOn(ApplicationRef.prototype, 'bootstrap').and.throwError('Sensitive bootstrap failure');

    await expectAsync(mount(host, context)).toBeRejectedWithError('PORTAL_MOUNT_FAILED');

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(host.childElementCount).toBe(0);
    expect(context.reportFailure).toHaveBeenCalledOnceWith({ code: 'PORTAL_RENDER_FAILED' });
  });
  it('distinguishes a fatal Angular error from cancellation and reports it once', async () => {
    spyOn(ApplicationRef.prototype, 'bootstrap').and.callFake(function (this: ApplicationRef) {
      this.injector.get(ErrorHandler).handleError(new Error('Sensitive render failure'));
      throw new Error('Sensitive render failure');
    });

    await expectAsync(mount(host, context)).toBeRejectedWithError('PORTAL_MOUNT_FAILED');

    expect(host.childElementCount).toBe(0);
    expect(context.reportFailure).toHaveBeenCalledOnceWith({ code: 'PORTAL_RENDER_FAILED' });
  });
});
