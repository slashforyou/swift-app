/**
 * Utilitaires de test partagés pour le système Staff
 */

import { Contractor, Employee, InviteEmployeeData } from '../../src/types/staff';

// Factory pour créer des employés de test
export const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp_test_' + Date.now(),
  type: 'employee',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@swift-removals.com.au',
  phone: '+61 412 345 678',
  role: 'Mover',
  team: 'Local Moving Team A',
  startDate: '2023-01-01',
  status: 'active',
  tfn: '123-456-789',
  hourlyRate: 30,
  invitationStatus: 'accepted',
  accountLinked: true,
  ...overrides,
});

// Factory pour créer des prestataires de test
export const createMockContractor = (overrides: Partial<Contractor> = {}): Contractor => ({
  id: 'con_test_' + Date.now(),
  type: 'contractor',
  firstName: 'Mike',
  lastName: 'Wilson',
  email: 'mike.wilson@contractor.com.au',
  phone: '+61 423 456 789',
  role: 'Specialized Mover',
  abn: '12 345 678 901',
  rate: 50,
  rateType: 'hourly',
  contractStatus: 'standard',
  isVerified: true,
  startDate: '2023-01-01',
  status: 'active',
  ...overrides,
});

// Factory pour créer des données d'invitation d'employé
export const createInviteEmployeeData = (overrides: Partial<InviteEmployeeData> = {}): InviteEmployeeData => ({
  firstName: 'New',
  lastName: 'Employee',
  email: 'new.employee@swift-removals.com.au',
  phone: '+61 434 567 890',
  role: 'Junior Mover',
  team: 'Training Team',
  hourlyRate: 25,
  ...overrides,
});

// Helpers pour les assertions de test
export const expectValidEmployee = (employee: any) => {
  expect(employee).toHaveProperty('id');
  expect(employee).toHaveProperty('type', 'employee');
  expect(employee).toHaveProperty('firstName');
  expect(employee).toHaveProperty('lastName');
  expect(employee).toHaveProperty('email');
  expect(employee).toHaveProperty('phone');
  expect(employee).toHaveProperty('role');
  expect(employee).toHaveProperty('team');
  expect(employee).toHaveProperty('hourlyRate');
  expect(employee).toHaveProperty('invitationStatus');
  expect(employee).toHaveProperty('accountLinked');
  expect(typeof employee.hourlyRate).toBe('number');
  expect(employee.hourlyRate).toBeGreaterThan(0);
};

export const expectValidContractor = (contractor: any) => {
  expect(contractor).toHaveProperty('id');
  expect(contractor).toHaveProperty('type', 'contractor');
  expect(contractor).toHaveProperty('firstName');
  expect(contractor).toHaveProperty('lastName');
  expect(contractor).toHaveProperty('email');
  expect(contractor).toHaveProperty('phone');
  expect(contractor).toHaveProperty('role');
  expect(contractor).toHaveProperty('abn');
  expect(contractor).toHaveProperty('rate');
  expect(contractor).toHaveProperty('rateType');
  expect(contractor).toHaveProperty('contractStatus');
  expect(contractor).toHaveProperty('isVerified');
  expect(typeof contractor.rate).toBe('number');
  expect(contractor.rate).toBeGreaterThan(0);
};

// Helpers pour valider les formats australiens
export const expectValidAustralianPhone = (phone: string) => {
  expect(phone).toMatch(/^\+61\s?\d{3}\s?\d{3}\s?\d{3}$|^\+61\d{9}$/);
};

export const expectValidTFN = (tfn: string | undefined) => {
  if (tfn) {
    expect(tfn).toMatch(/^\d{3}-\d{3}-\d{3}$/);
  }
};

export const expectValidABN = (abn: string) => {
  expect(abn).toMatch(/^\d{2}\s\d{3}\s\d{3}\s\d{3}$|^\d{11}$/);
};

export const expectValidEmail = (email: string, domain?: string) => {
  expect(email).toContain('@');
  if (domain) {
    expect(email).toContain(domain);
  }
};

// Mock data sets pour les tests
export const MOCK_EMPLOYEES: Employee[] = [
  createMockEmployee({
    id: 'emp_mock_1',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'Moving Supervisor',
    team: 'Local Moving Team A',
    hourlyRate: 38,
    invitationStatus: 'accepted',
    accountLinked: true,
  }),
  createMockEmployee({
    id: 'emp_mock_2',
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'Senior Mover',
    team: 'Interstate Moving Team',
    hourlyRate: 35,
    invitationStatus: 'pending',
    accountLinked: false,
    tfn: undefined,
  }),
  createMockEmployee({
    id: 'emp_mock_3',
    firstName: 'Carol',
    lastName: 'Williams',
    role: 'Packing Specialist',
    team: 'Local Moving Team B',
    hourlyRate: 32,
    invitationStatus: 'expired',
    accountLinked: false,
    tfn: undefined,
  }),
];

export const MOCK_CONTRACTORS: Contractor[] = [
  createMockContractor({
    id: 'con_mock_1',
    firstName: 'David',
    lastName: 'Expert',
    role: 'Heavy Lifting Specialist',
    abn: '11 222 333 444',
    rate: 65,
    rateType: 'hourly',
    contractStatus: 'preferred',
    isVerified: true,
  }),
  createMockContractor({
    id: 'con_mock_2',
    firstName: 'Emma',
    lastName: 'Professional',
    role: 'Piano Moving Expert',
    abn: '55 666 777 888',
    rate: 450,
    rateType: 'project',
    contractStatus: 'exclusive',
    isVerified: false,
  }),
  createMockContractor({
    id: 'con_mock_3',
    firstName: 'Frank',
    lastName: 'Reliable',
    role: 'General Mover',
    abn: '99 000 111 222',
    rate: 45,
    rateType: 'hourly',
    contractStatus: 'standard',
    isVerified: true,
  }),
];

// Helpers pour simuler les réponses d'API
export const createApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString(),
});

export const createApiError = (message: string, code = 500) => ({
  success: false,
  error: {
    message,
    code,
  },
  timestamp: new Date().toISOString(),
});

// Helpers pour les tests d'intégration
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockStaffHook = (overrides = {}) => ({
  employees: [],
  contractors: [],
  inviteEmployee: jest.fn().mockResolvedValue(undefined),
  searchContractor: jest.fn().mockResolvedValue([]),
  addContractor: jest.fn().mockResolvedValue(undefined),
  isLoading: false,
  error: null,
  ...overrides,
});

// Helpers pour les tests de validation
export const VALID_ROLES = [
  'Moving Supervisor',
  'Senior Mover',
  'Mover',
  'Packing Specialist',
  'Driver',
  'Heavy Lifting Specialist',
  'Logistics Coordinator',
];

export const VALID_TEAMS = [
  'Local Moving Team A',
  'Local Moving Team B',
  'Interstate Moving Team',
  'International Moving Team',
  'Storage Team',
  'Customer Service Team',
];

export const VALID_CONTRACT_STATUSES = [
  'standard',
  'preferred', 
  'exclusive',
  'non-exclusive',
] as const;

export const VALID_INVITATION_STATUSES = [
  'pending',
  'accepted',
  'expired',
  'completed',
] as const;

// Helpers pour les tests de performance
export const measureExecutionTime = async (fn: () => Promise<void>) => {
  const start = Date.now();
  await fn();
  const end = Date.now();
  return end - start;
};

export const expectExecutionTimeLessThan = async (fn: () => Promise<void>, maxTime: number) => {
  const executionTime = await measureExecutionTime(fn);
  expect(executionTime).toBeLessThan(maxTime);
};

// Export par défaut avec toutes les utilities
export default {
  createMockEmployee,
  createMockContractor,
  createInviteEmployeeData,
  expectValidEmployee,
  expectValidContractor,
  expectValidAustralianPhone,
  expectValidTFN,
  expectValidABN,
  expectValidEmail,
  MOCK_EMPLOYEES,
  MOCK_CONTRACTORS,
  createApiResponse,
  createApiError,
  waitForAsync,
  createMockStaffHook,
  VALID_ROLES,
  VALID_TEAMS,
  VALID_CONTRACT_STATUSES,
  VALID_INVITATION_STATUSES,
  measureExecutionTime,
  expectExecutionTimeLessThan,
};