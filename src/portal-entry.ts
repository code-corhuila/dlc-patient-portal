import { ApplicationRef, ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { PortalFrame } from './app/portal-frame';
import { PORTAL_CONTEXT, PortalContext, PortalHandle } from './app/shell-contract';

export const portalId = 'patient';
export const contractVersion = 1;

export async function mount(host: HTMLElement, context: PortalContext): Promise<PortalHandle> {
  if (context.portalId !== portalId || context.contractVersion !== contractVersion) {
    throw new Error('INVALID_CONTEXT');
  }
  if (context.signal.aborted) throw new Error('CANCELLED');
  if (host.childNodes.length) throw new Error('HOST_NOT_EMPTY');

  const root = host.ownerDocument.createElement('dlc-patient-root');
  let application: ApplicationRef | undefined;
  let disposed = false;
  let renderingFailed = false;
  const unmount = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    context.signal.removeEventListener('abort', onAbort);
    try {
      application?.destroy();
    } finally {
      root.remove();
    }
  };
  const reportFailure = (): void => context.reportFailure({ code: 'PORTAL_RENDER_FAILED' });
  const onAbort = (): void => {
    void unmount().catch(reportFailure);
  };
  context.signal.addEventListener('abort', onAbort, { once: true });
  try {
    host.append(root);
    application = await createApplication({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PORTAL_CONTEXT, useValue: context },
        {
          provide: ErrorHandler,
          useValue: { handleError: () => {
            renderingFailed = true;
            void unmount().catch(reportFailure);
            reportFailure();
          } },
        },
      ],
    });
    if (disposed) {
      application.destroy();
      throw new Error('CANCELLED');
    }
    const component = application.bootstrap(PortalFrame, root);
    if (disposed) throw new Error('PORTAL_MOUNT_FAILED');
    return {
      async updateRoute(route) {
        if (disposed) throw new Error('CANCELLED');
        component.instance.route.set(route);
        application!.tick();
      },
      async canLeave() {
        return true;
      },
      unmount,
    };
  } catch {
    const cancelled = disposed && !renderingFailed;
    await unmount();
    if (!cancelled && !renderingFailed) reportFailure();
    throw new Error(cancelled ? 'CANCELLED' : 'PORTAL_MOUNT_FAILED');
  }
}
