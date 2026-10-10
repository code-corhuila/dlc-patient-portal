import { Patient, PatientForCare, PatientPage } from './patient';
import { toPatientListItem } from './patient-list-item';

describe('Patient list projection — HU-PAT-001', () => {
  const carePatient: PatientForCare = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Ana Demo',
    status: 'ACTIVE',
    version: 1,
  };

  const administrativePatient: Patient = {
    ...carePatient,
    documentType: 'CC',
    documentNumber: '1000000001',
    birthDate: '1990-01-15',
    phone: '3000000001',
    email: 'ana.demo@example.com',
    address: 'Fictional address',
    emergencyContacts: [{ name: 'Contact Demo', relationship: 'Family', phone: '3000000002' }],
  };

  it('maps administrative data without forwarding detail-only fields', () => {
    expect(toPatientListItem(administrativePatient)).toEqual({
      id: carePatient.id,
      name: 'Ana Demo',
      documentNumber: '1000000001',
      phone: '3000000001',
      email: 'ana.demo@example.com',
      status: 'ACTIVE',
    });
  });

  it('accepts the minimum care projection without inventing contact or document data', () => {
    expect(toPatientListItem(carePatient)).toEqual({
      id: carePatient.id,
      name: 'Ana Demo',
      documentNumber: undefined,
      phone: undefined,
      email: undefined,
      status: 'ACTIVE',
    });
  });

  it('does not forward unexpected fields from an owner response', () => {
    const response = { ...carePatient, documentNumber: 'PRIVATE', diagnosis: 'PRIVATE' };

    const item = toPatientListItem(response);

    expect(item.documentNumber).toBeUndefined();
    expect(Object.keys(item)).not.toContain('diagnosis');
    expect(response.documentNumber).toBe('PRIVATE');
  });

  it('maps both owner projections from a paginated response without mutating metadata', () => {
    const page: PatientPage = {
      data: [administrativePatient, carePatient],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };

    const items = page.data.map(toPatientListItem);

    expect(items[0].documentNumber).toBe('1000000001');
    expect(items[1].documentNumber).toBeUndefined();
    expect(page.data[0]).toBe(administrativePatient);
    expect(page.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });
});
