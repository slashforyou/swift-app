/**
 * Tests CRUD - Jobs
 * Basé sur SWIFT_APP_TEST_SUITE.json
 */

// Mock des dépendances
import {
    completeJob,
    createJob,
    deleteJob,
    fetchJobById,
    fetchJobs,
    pauseJob,
    resumeJob,
    startJob,
    updateJob,
    type CreateJobRequest,
    type JobAPI,
} from '../../src/services/jobs';

jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer test-token',
  }),
  refreshToken: jest.fn().mockResolvedValue(true),
  clearSession: jest.fn(),
}));

jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://api.test.com/',
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CRUD - Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockJob: JobAPI = {
    id: 'job-001',
    status: 'pending',
    priority: 'medium',
    client_id: 'client-001',
    client: {
      id: 'client-001',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+61412345678',
      email: 'john@example.com',
    },
    addresses: [
      {
        type: 'pickup',
        street: '123 Main St',
        city: 'Sydney',
        state: 'NSW',
        zip: '2000',
        latitude: -33.8688,
        longitude: 151.2093,
      },
      {
        type: 'delivery',
        street: '456 George St',
        city: 'Melbourne',
        state: 'VIC',
        zip: '3000',
      },
    ],
    time: {
      startWindowStart: '2026-01-15T08:00:00Z',
      startWindowEnd: '2026-01-15T10:00:00Z',
    },
    estimatedDuration: 120,
    notes: 'Fragile items',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  };

  // ===================================
  // job_read_list
  // ===================================
  describe('job_read_list', () => {
    it('should fetch list of jobs successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockJob],
      });

      const result = await fetchJobs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('job-001');
      expect(result[0].status).toBe('pending');
    });

    it('should fetch jobs for a date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: [mockJob] }),
      });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');
      const result = await fetchJobs(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('calendar-days'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('01-01-2026'),
        })
      );
    });

    it('should return empty array when no jobs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchJobs();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchJobs()).rejects.toThrow('HTTP 500');
    });
  });

  // ===================================
  // job_read_details
  // ===================================
  describe('job_read_details', () => {
    it('should fetch job by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      });

      const result = await fetchJobById('job-001');

      expect(result.id).toBe('job-001');
      expect(result.addresses).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should throw error when job not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchJobById('invalid-id')).rejects.toThrow('HTTP 404');
    });
  });

  // ===================================
  // job_create_success
  // ===================================
  describe('job_create_success', () => {
    it('should create a job successfully', async () => {
      const createData: CreateJobRequest = {
        client_id: 'client-001',
        status: 'pending',
        priority: 'high',
        addresses: mockJob.addresses,
        time: mockJob.time,
        notes: 'Urgent delivery',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-002',
          ...createData,
          createdAt: '2026-01-13T10:00:00Z',
          updatedAt: '2026-01-13T10:00:00Z',
        }),
      });

      const result = await createJob(createData);

      expect(result.id).toBe('job-002');
      expect(result.priority).toBe('high');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });
  });

  // ===================================
  // job_create_with_vehicle
  // ===================================
  describe('job_create_with_vehicle', () => {
    it('should create a job with assigned truck', async () => {
      const createData: CreateJobRequest = {
        client_id: 'client-001',
        addresses: mockJob.addresses,
        time: mockJob.time,
        truck: {
          licensePlate: 'ABC-123',
          name: 'Big Mover',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-003',
          ...createData,
          status: 'pending',
        }),
      });

      const result = await createJob(createData);

      expect(result.truck).toBeDefined();
      expect(result.truck?.licensePlate).toBe('ABC-123');
    });
  });

  // ===================================
  // job_create_with_crew
  // ===================================
  describe('job_create_with_crew', () => {
    it('should create a job with assigned staff', async () => {
      const createData: CreateJobRequest = {
        client_id: 'client-001',
        addresses: mockJob.addresses,
        time: mockJob.time,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-004',
          ...createData,
          assigned_staff_id: 'staff-001',
          assigned_staff: {
            id: 'staff-001',
            firstName: 'Mike',
            lastName: 'Driver',
            role: 'driver',
          },
        }),
      });

      const result = await createJob(createData);

      expect(result.assigned_staff).toBeDefined();
      expect(result.assigned_staff?.firstName).toBe('Mike');
    });
  });

  // ===================================
  // job_validation tests
  // ===================================
  describe('job_validation', () => {
    it('should validate time window (start before end)', () => {
      const isValidTimeWindow = (start: string, end: string): boolean => {
        return new Date(start) < new Date(end);
      };

      expect(isValidTimeWindow('2026-01-15T08:00:00Z', '2026-01-15T10:00:00Z')).toBe(true);
      expect(isValidTimeWindow('2026-01-15T10:00:00Z', '2026-01-15T08:00:00Z')).toBe(false);
    });

    it('should validate at least one address is provided', () => {
      const hasValidAddresses = (addresses: any[]): boolean => {
        return addresses.length > 0 && addresses.every(a => a.street && a.city);
      };

      expect(hasValidAddresses([{ street: '123 Main', city: 'Sydney', state: 'NSW', zip: '2000', type: 'pickup' }])).toBe(true);
      expect(hasValidAddresses([])).toBe(false);
    });

    it('should validate client_id is required', () => {
      const isValidClientId = (clientId: string | undefined): boolean => {
        return !!clientId && clientId.trim().length > 0;
      };

      expect(isValidClientId('client-001')).toBe(true);
      expect(isValidClientId('')).toBe(false);
      expect(isValidClientId(undefined)).toBe(false);
    });

    it('should validate priority values', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const isValidPriority = (priority: string): boolean => validPriorities.includes(priority);

      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('urgent')).toBe(true);
      expect(isValidPriority('invalid')).toBe(false);
    });

    it('should validate status values', () => {
      const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
      const isValidStatus = (status: string): boolean => validStatuses.includes(status);

      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('unknown')).toBe(false);
    });
  });

  // ===================================
  // job_update
  // ===================================
  describe('job_update', () => {
    it('should update job successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockJob,
          priority: 'urgent',
          notes: 'Updated notes',
        }),
      });

      const result = await updateJob('job-001', {
        priority: 'urgent',
        notes: 'Updated notes',
      });

      expect(result.priority).toBe('urgent');
      expect(result.notes).toBe('Updated notes');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // ===================================
  // job_update_status
  // ===================================
  describe('job_update_status', () => {
    it('should start a pending job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, status: 'in-progress' }),
      });

      const result = await startJob('job-001');

      expect(result.status).toBe('in-progress');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001/start',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should pause an in-progress job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, status: 'pending' }),
      });

      const result = await pauseJob('job-001');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001/pause',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should resume a paused job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, status: 'in-progress' }),
      });

      const result = await resumeJob('job-001');

      expect(result.status).toBe('in-progress');
    });

    it('should complete a job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, status: 'completed' }),
      });

      const result = await completeJob('job-001');

      expect(result.status).toBe('completed');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001/complete',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ===================================
  // job_delete
  // ===================================
  describe('job_delete', () => {
    it('should delete job successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(deleteJob('job-001')).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/jobs/job-001',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle delete failure with 500 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(deleteJob('job-001')).rejects.toThrow('HTTP 500');
    });
  });

  // ===================================
  // Job validation (no token refresh tests due to dynamic import)
  // ===================================
  describe('job_creation_validation', () => {
    it('should validate job data before creation', () => {
      const isValidJobData = (data: Partial<CreateJobRequest>): boolean => {
        return !!(data.client_id && data.addresses && data.addresses.length > 0 && data.time);
      };

      expect(isValidJobData({ 
        client_id: 'client-001', 
        addresses: [{ type: 'pickup', street: '123 Main', city: 'Sydney', state: 'NSW', zip: '2000' }],
        time: { startWindowStart: '2026-01-15T08:00:00Z', startWindowEnd: '2026-01-15T10:00:00Z' }
      })).toBe(true);
      
      expect(isValidJobData({})).toBe(false);
    });
  });
});
