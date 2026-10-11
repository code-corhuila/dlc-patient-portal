import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Input, ViewChild, inject, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { CreatePatientRequest } from '../../model/patient';
import { PATIENT_CREATION_FIELDS, PatientCreationValues } from '../../model/patient-creation-contract';
import { createPatientCreationForm, toPatientCreationRequest } from './patient-creation-form';

const requiredText: ValidatorFn = control => String(control.value).trim() ? null : { required: true };
@Component({
  selector: 'app-patient-form', standalone: true, imports: [ReactiveFormsModule],
  templateUrl: './patient-form.component.html', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientFormComponent {
  private readonly core = createPatientCreationForm();
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  @ViewChild('leaveDialog') private leaveDialog?: ElementRef<HTMLDialogElement>;
  private resolveLeave?: (value: boolean) => void;
  private leavePending?: Promise<boolean>;
  readonly fields = PATIENT_CREATION_FIELDS;
  readonly contactLimits = {
    name: this.fields.find(field => field.key === 'emergencyName')!.max,
    relationship: this.fields.find(field => field.key === 'emergencyRelationship')!.max,
    phone: this.fields.find(field => field.key === 'emergencyPhone')!.max,
  };
  readonly save = output<CreatePatientRequest>();
  readonly cancel = output<void>();
  private initial: Partial<CreatePatientRequest> = {};
  private editing = false;
  private readonly createValidators = Object.fromEntries(this.fields.map(field => [field.key, this.core.controls[field.key].validator]));
  @Input() set mode(value: 'create' | 'edit') { this.editing = value === 'edit'; this.applyMode(); }
  get mode(): 'create' | 'edit' { return this.editing ? 'edit' : 'create'; }
  @Input() title = 'Add patient';
  @Input() failure = '';
  @Input() saved = false;
  @Input() busy = false;
  readonly form = new FormGroup({ ...this.core.controls,
    additionalContacts: new FormArray<ReturnType<PatientFormComponent['contactGroup']>>([]),
  }, { validators: this.core.validator });

  @Input() set initialValue(value: Partial<CreatePatientRequest> | null) {
    this.initial = structuredClone(value ?? {});
    this.answerLeave(false);
    const contact = value?.emergencyContacts?.[0];
    const extras = value?.emergencyContacts?.slice(1) ?? [];
    const blank = Object.fromEntries(this.fields.map(field => [field.key, ''])) as PatientCreationValues;
    this.form.controls.additionalContacts.clear();
    for (const extra of extras) this.form.controls.additionalContacts.push(this.contactGroup(extra));
    this.form.reset({ ...blank, ...value, address: value?.address ?? '', additionalContacts: extras,
      emergencyName: contact?.name ?? '', emergencyRelationship: contact?.relationship ?? '',
      emergencyPhone: contact?.phone ?? '' });
    this.applyMode();
  }

  private applyMode(): void {
    for (const field of this.fields) {
      const control = this.form.controls[field.key];
      control.setValidators(candidate => this.editing && !this.initial[field.key as keyof CreatePatientRequest] &&
        !String(candidate.value).trim() ? null : this.createValidators[field.key]?.(candidate) ?? null);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }  constructor() { inject(DestroyRef).onDestroy(() => this.answerLeave(false)); }
  submit(): void {
    if (this.saved || this.busy) return;
    for (const field of this.fields) {
      const control = this.form.controls[field.key]; control.setValue(control.value.trim());
    }
    for (const contact of this.form.controls.additionalContacts.controls) {
      for (const control of Object.values(contact.controls)) control.setValue(control.value.trim());
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.element.nativeElement.querySelector<HTMLElement>('[data-error-summary]')?.focus();
      return;
    }
    const raw = this.form.getRawValue();
    const request = toPatientCreationRequest(raw);
    const contacts = [...(request.emergencyContacts ?? []), ...raw.additionalContacts];
    if (contacts.length) request.emergencyContacts = contacts;
    this.save.emit(request);
  }
  contactGroup(value = { name: '', relationship: '', phone: '' }) {
    const control = (text: string, source: 'emergencyName' | 'emergencyRelationship' | 'emergencyPhone') =>
      new FormControl(text, { nonNullable: true, validators: [requiredText, this.core.controls[source].validator!] });
    return new FormGroup({ name: control(value.name, 'emergencyName'),
      relationship: control(value.relationship, 'emergencyRelationship'), phone: control(value.phone, 'emergencyPhone') });
  }
  addContact(): void {
    this.form.controls.additionalContacts.push(this.contactGroup()); this.form.markAsDirty();
  }
  canLeave(): Promise<boolean> {
    if (this.busy) return Promise.resolve(false);
    if (this.saved || !this.form.dirty) return Promise.resolve(true);
    if (this.leavePending) return this.leavePending;
    if (!this.leaveDialog) return Promise.resolve(false);
    this.leavePending = new Promise(resolve => { this.resolveLeave = resolve; });
    this.leaveDialog.nativeElement.showModal();
    return this.leavePending;
  }
  answerLeave(value: boolean): void {
    this.leaveDialog?.nativeElement.close(); this.resolveLeave?.(value);
    this.resolveLeave = undefined; this.leavePending = undefined;
  }
}
