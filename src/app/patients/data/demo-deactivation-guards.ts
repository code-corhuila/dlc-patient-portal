import { Injectable } from '@angular/core';
import { DEMO_DEACTIVATION_GUARDS } from '../model/patient-deactivation';

// In-memory Cut 2 fixture adapter. Replace with coordinated owner verification for real data.
@Injectable({ providedIn: 'root' })
export class DemoDeactivationGuards {
  private readonly states = new Map<string, 'clear' | 'blocked'>(Object.entries(DEMO_DEACTIVATION_GUARDS));
  read(id: string): 'clear' | 'blocked' | undefined { return this.states.get(id); }
  register(id: string): void { this.states.set(id, 'clear'); }
}
