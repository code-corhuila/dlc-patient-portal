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
  readonly navigation: {
    request(target: { path: string; replace?: boolean }):
      Promise<{ status: 'applied' | 'cancelled' | 'rejected' }>;
  };
  readonly session: {
    getSnapshot(): SessionSnapshot;
    subscribe(listener: (snapshot: SessionSnapshot) => void): () => void;
  };
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

export interface SessionSnapshot {
  readonly state: 'resolving' | 'authenticated' | 'anonymous' | 'expired' | 'unavailable';
  readonly revision: number;
  readonly user: { readonly id: string; readonly name: string; readonly roles: readonly string[] } | null;
  readonly permissions: readonly string[];
  readonly expiresAt: string | null;
  readonly reason: null | 'NO_SESSION' | 'EXPIRED' | 'UNAUTHORIZED' | 'LOGOUT' | 'DEPENDENCY_UNAVAILABLE';
}
