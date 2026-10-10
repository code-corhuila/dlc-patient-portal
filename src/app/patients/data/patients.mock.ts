import { Patient } from '../model/patient';

export const PATIENT_FIXTURES: readonly Patient[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    documentType: 'CC',
    documentNumber: '1000000001',
    name: 'Ana Demo',
    phone: '3000000001',
    email: 'ana.demo@example.com',
    status: 'ACTIVE',
    version: 1,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    documentType: 'CC',
    documentNumber: '1000000002',
    name: 'Carlos Prueba',
    phone: '3000000002',
    email: 'carlos.prueba@example.com',
    status: 'ACTIVE',
    version: 1,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    documentType: 'CC',
    documentNumber: '1000000003',
    name: 'Laura Mock',
    phone: '3000000003',
    email: 'laura.mock@example.com',
    status: 'INACTIVE',
    version: 1,
  },
];
