import { Patient } from '../model/patient';

export const PATIENT_FIXTURES: readonly Patient[] = [
  {
    id: 'PAT-DEMO-001',
    documentNumber: '1000000001',
    firstName: 'Ana',
    lastName: 'Demo',
    phone: '3000000001',
    email: 'ana.demo@example.com',
    status: 'ACTIVE',
  },
  {
    id: 'PAT-DEMO-002',
    documentNumber: '1000000002',
    firstName: 'Carlos',
    lastName: 'Prueba',
    phone: '3000000002',
    email: 'carlos.prueba@example.com',
    status: 'ACTIVE',
  },
  {
    id: 'PAT-DEMO-003',
    documentNumber: '1000000003',
    firstName: 'Laura',
    lastName: 'Mock',
    phone: '3000000003',
    email: 'laura.mock@example.com',
    status: 'INACTIVE',
  },
];