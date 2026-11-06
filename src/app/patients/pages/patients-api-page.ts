import { Component, DestroyRef, Input, OnChanges, ViewChild, inject, signal } from '@angular/core';
import { PORTAL_CONTEXT, PortalRoute } from '../../shell-contract';
import { PatientFormComponent } from '../components/patient-form/patient-form.component';
import { PatientListComponent } from '../components/patient-list/patient-list.component';
import { CreatePatientRequest, Patient, PatientPage } from '../model/patient';
import { patientEditRequest } from '../model/patient-edit-request';

type Request = { method: string; path: string; query?: Record<string, string[]>; body?: unknown;
  headers?: Record<string, string>; signal: AbortSignal };
type Result = { ok: true; data: unknown } | { ok: false; status: number; error: string };
export interface PatientHttp { request(input: Request): Promise<Result>; }
export function hasPatientHttp(value: unknown): value is PatientHttp {
  return !!value && typeof (value as PatientHttp).request === 'function';
}
@Component({ selector: 'app-patients-api-page', standalone: true,
  imports: [PatientFormComponent, PatientListComponent], templateUrl: './patients-api-page.html',
  styleUrls: ['./patients-page/patients-page.component.css', '../shared/styles/patient-modal.css'] })
export class PatientsApiPage implements OnChanges {
  @Input({ required: true }) route!: PortalRoute;
  @ViewChild(PatientFormComponent) form?: PatientFormComponent;
  private readonly context = inject(PORTAL_CONTEXT);
  private readonly lifetime = new AbortController();
  private generation = 0;
  private registration?: { payload: string; key: string };
  readonly result = signal<PatientPage>({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  readonly failure = signal(''); readonly busy = signal(false); readonly saving = signal(false);
  readonly saved = signal(false); readonly patient = signal<Patient | null>(null);
  query = ''; activeOnly = false; page = 1; editId = ''; creating = false;
  constructor() { inject(DestroyRef).onDestroy(() => { this.generation++; this.lifetime.abort(); }); }
  allowed(permission: string): boolean {
    const s = this.context.session.getSnapshot();
    return s.state === 'authenticated' && s.permissions.includes(permission) &&
      !!s.user?.roles.some(role => ['ADMINISTRATOR', 'SECRETARY_ASSISTANT', ...(permission === 'patients:read' ? ['DENTIST'] : [])].includes(role));
  }
  ngOnChanges(): void {
    this.query = this.route.query['q']?.[0] ?? ''; this.page = 1;
    this.creating = this.route.localPath === '/new';
    this.editId = /^\/profiles\/([0-9a-f-]{36})\/edit$/i.exec(this.route.localPath)?.[1] ?? '';
    void this.load();
  }
  async load(): Promise<void> {
    const generation = ++this.generation; this.patient.set(null); this.saved.set(false);
    this.result.set({ data: [], meta: { page: this.page, limit: 20, total: 0, totalPages: 0 } });
    this.failure.set(''); this.busy.set(true);
    try {
      if (!this.allowed('patients:read')) throw new Error('No tienes permiso para consultar pacientes.');
      if (this.route.localPath !== '/' && !this.creating && !this.editId) throw new Error('Página no encontrada.');
      const data = await this.request('GET', '/api/v1/patients', undefined, {
        page: [String(this.page)], limit: ['20'], ...(this.query.trim() ? { search: [this.query.trim()] } : {}),
        ...(this.activeOnly ? { status: ['ACTIVE'] } : {}) });
      const page = data as PatientPage;
      if (!page || !Array.isArray(page.data) || !page.meta || !Number.isInteger(page.meta.totalPages)) throw new Error('Respuesta de pacientes inválida.');
      if (generation !== this.generation) return;
      this.result.set(page);
      if (this.editId && this.allowed('patients:write')) {
        const patient = await this.request('GET', '/api/v1/patients/' + this.editId) as Patient;
        if (!patient || patient.id !== this.editId || typeof patient.documentType !== 'string' || !Number.isInteger(patient.version))
          throw new Error('Respuesta de paciente inválida.');
        if (generation === this.generation) this.patient.set(patient);
      }
    } catch (error) { if (generation === this.generation) this.failure.set(this.message(error)); }
    finally { if (generation === this.generation) this.busy.set(false); }
  }
  async save(draft: CreatePatientRequest): Promise<void> {
    if (this.busy() || this.saving() || this.saved() || this.lifetime.signal.aborted) return;
    const permission = this.creating ? 'patients:register' : 'patients:write';
    if (!this.allowed(permission)) { this.failure.set('No tienes permiso para guardar pacientes.'); return; }
    this.saving.set(true); this.failure.set('');
    try {
      if (this.creating) {
        const payload = JSON.stringify(draft);
        if (this.registration?.payload !== payload) this.registration = { payload, key: crypto.randomUUID() };
        await this.request('POST', '/api/v1/patients', draft, undefined, { 'Idempotency-Key': this.registration!.key });
      } else {
        const current = this.patient(); if (!current) throw new Error('Recarga el paciente antes de editar.');
        let patch;
        try { patch = patientEditRequest(current, draft); }
        catch { throw new Error('Revisa los campos administrativos modificados.'); }
        if (!patch) throw new Error('No hay cambios para guardar.');
        await this.request('PATCH', '/api/v1/patients/' + current.id, patch);
      }
      if (this.lifetime.signal.aborted) return;
      this.saved.set(true); this.registration = undefined;
      await this.navigate('');
    } catch (error) { if (!this.lifetime.signal.aborted) this.failure.set(this.message(error)); }
    finally { this.saving.set(false); }
  }
  canLeave(): Promise<boolean> { return this.saved() ? Promise.resolve(true) : this.saving() ? Promise.resolve(false) : this.form?.canLeave() ?? Promise.resolve(true); }
  async reload(): Promise<void> { if (await this.canLeave()) await this.load(); }
  async navigate(path: string): Promise<void> {
    // The shell invokes canLeave once before applying any route change.
    try {
      const result = await this.context.navigation.request({ path: '/app/patients' + path });
      if (!this.lifetime.signal.aborted && result.status === 'rejected') this.failure.set('No se pudo aplicar la navegación.');
    } catch { if (!this.lifetime.signal.aborted) this.failure.set('No se pudo aplicar la navegación.'); }
  }
  changePage(offset: number): void { if (!this.busy()) { this.page += offset; void this.load(); } }
  private async request(method: string, path: string, body?: unknown, query?: Request['query'], headers?: Request['headers']): Promise<unknown> {
    if (!hasPatientHttp(this.context.http)) throw new Error('La conexión con la aplicación no está disponible.');
    let response: Result;
    try { response = await this.context.http.request({ method, path, body, query, headers,
      signal: AbortSignal.any([this.context.signal, this.lifetime.signal]) }); }
    catch { throw new Error('No se pudo contactar al servicio de pacientes.'); }
    if (response.ok) return response.data;
    const messages: Record<string, string> = { PATIENT_DOCUMENT_EXISTS: 'Ya existe un paciente con este documento.',
      STALE_VERSION: 'El paciente cambió. Recarga antes de reintentar.', IDEMPOTENCY_CONFLICT: 'La solicitud ya se utilizó con otros datos.' };
    throw new Error(messages[response.error] ?? ({ 401: 'La sesión ya no es válida.', 403: 'No tienes permiso para esta operación.',
      404: 'Paciente no encontrado.', 400: 'Revisa los datos ingresados.', 503: 'El servicio de pacientes no está disponible.' } as Record<number, string>)[response.status] ?? 'No se pudo completar la operación.');
  }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'No se pudo completar la operación.'; }
}
