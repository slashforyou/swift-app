/**
 * Mock Job Data for Testing
 * Provides factory functions for creating consistent test job objects
 */

export interface MockJobOptions {
  id?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  contractor?: {
    ContactName?: string;
    Company?: string;
    Phone?: string;
    Email?: string;
  };
  estimatedCost?: number;
  actualCost?: number | null;
  timer?: {
    totalTime?: number;
    billableTime?: number;
    hourlyRate?: number;
  };
  type?: string;
  itemsCount?: number;
  address?: string;
  scheduledDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

/**
 * Creates a mock job with default and override values
 */
export const createMockJob = (options: MockJobOptions = {}) => ({
  id: options.id || 'TEST-JOB-001',
  code: options.id || 'TEST-JOB-001',
  status: options.status || 'pending',
  type: options.type || 'Moving Service',
  itemsCount: options.itemsCount || 5,
  estimatedCost: options.estimatedCost || 150.00,
  actualCost: options.actualCost !== undefined ? options.actualCost : 125.50,
  currency: 'AUD',
  address: options.address || '123 Test Street, Sydney NSW 2000',
  scheduledDate: options.scheduledDate || '2024-01-15',
  paymentStatus: options.paymentStatus || 'pending',
  contractor: {
    ContactName: 'John Doe',
    Company: 'Test Moving Co',
    Phone: '+61 400 000 000',
    Email: 'john@testmoving.com',
    ...options.contractor,
  },
  timer: options.timer || null,
  items: [
    { id: 1, name: 'Sofa', category: 'Furniture' },
    { id: 2, name: 'Dining Table', category: 'Furniture' },
    { id: 3, name: 'Boxes (5)', category: 'Packaging' },
  ],
  notes: '',
  photos: [],
  signature: null,
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
});

/**
 * Creates a job with timer data for testing cost calculations
 */
export const createTimerJob = (overrides: MockJobOptions = {}) => createMockJob({
  ...overrides,
  timer: {
    totalTime: 3600, // 1 hour in seconds
    billableTime: 3600,
    hourlyRate: 150,
    ...overrides.timer,
  },
  actualCost: null, // Let timer calculate the cost
});

/**
 * Creates a completed job ready for payment
 */
export const createCompletedJob = (overrides: MockJobOptions = {}) => createMockJob({
  status: 'completed',
  actualCost: 125.50,
  ...overrides,
});

/**
 * Creates a job with specific payment status
 */
export const createPaidJob = (overrides: MockJobOptions = {}) => createMockJob({
  status: 'completed',
  actualCost: 125.50,
  paymentStatus: 'paid',
  ...overrides,
});

/**
 * Creates multiple jobs for list testing
 */
export const createMockJobList = (count: number = 5): any[] => {
  return Array.from({ length: count }, (_, index) => createMockJob({
    id: `TEST-JOB-${String(index + 1).padStart(3, '0')}`,
    status: index % 2 === 0 ? 'completed' : 'in_progress',
    estimatedCost: 100 + (index * 25),
    actualCost: 90 + (index * 20),
  }));
};

/**
 * Mock Stripe service responses
 */
export const createMockPaymentIntent = (overrides: any = {}) => ({
  payment_intent_id: 'pi_test_123456789',
  client_secret: 'pi_test_123456789_secret_abcdefgh',
  amount: 12550, // $125.50 in cents
  currency: 'aud',
  status: 'requires_payment_method',
  ...overrides,
});

export const createMockPaymentConfirmation = (overrides: any = {}) => ({
  job: createCompletedJob({ paymentStatus: 'paid' }),
  payment: {
    id: 'pi_test_123456789',
    status: 'succeeded',
    amount: 12550,
    currency: 'aud',
    created: new Date().toISOString(),
  },
  ...overrides,
});

/**
 * Mock staff member data
 */
export const createMockStaffMember = (overrides: any = {}) => ({
  id: `STAFF-${Math.random().toString(36).substr(2, 9)}`,
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+61 400 000 000',
  type: 'employee', // 'employee' | 'contractor'
  hourlyRate: 45.00,
  status: 'active',
  skills: ['Moving', 'Packing'],
  availability: 'full_time',
  startDate: '2024-01-01',
  ...overrides,
});

/**
 * Mock business data
 */
export const createMockBusiness = (overrides: any = {}) => ({
  id: 'BIZ-001',
  name: 'Test Moving Company',
  abn: '12 345 678 901',
  address: '456 Business Ave, Sydney NSW 2000',
  phone: '+61 2 9000 0000',
  email: 'info@testmoving.com',
  website: 'https://testmoving.com',
  stripeAccountId: 'acct_test_123456789',
  stripeStatus: 'active',
  ...overrides,
});

/**
 * Mock API error responses for error testing
 */
export const createMockApiError = (message: string = 'API Error', status: number = 500) => {
  const error = new Error(message) as any;
  error.status = status;
  error.response = {
    status,
    data: { message },
  };
  return error;
};

/**
 * Mock network error for offline testing
 */
export const createMockNetworkError = () => {
  const error = new Error('Network request failed') as any;
  error.code = 'NETWORK_ERROR';
  return error;
};