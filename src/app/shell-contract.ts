import { InjectionToken } from '@angular/core';

export interface PortalRoute {
  readonly compositionId: string;
  readonly globalPath: string;
  readonly basePath: string;
  readonly localPath: string;
  readonly query: Readonly<Record<string, readonly string[]>>;
  readonly fragment: string;
}

export interface PortalContext {
  readonly contractVersion: number;
  readonly portalId: string;
  readonly mountId: string;
  readonly compositionId: string;
  readonly route: PortalRoute;
  readonly signal: AbortSignal;
  readonly navigation: unknown;
  readonly session: unknown;
  readonly http: unknown;
  readonly reportFailure: (failure: {
    code: 'PORTAL_RENDER_FAILED' | 'PORTAL_TASK_FAILED';
  }) => void;
}

export interface PortalHandle {
  updateRoute(route: PortalRoute): Promise<void>;
  canLeave(): Promise<boolean>;
  unmount(): Promise<void>;
}

export const PORTAL_CONTEXT = new InjectionToken<PortalContext>('patient.portal-context');
