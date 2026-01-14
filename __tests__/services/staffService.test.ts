/**
 * Tests CRUD - Staff (Employees & Contractors)
 * Basé sur SWIFT_APP_TEST_SUITE.json
 */

// Mock des dépendances
import { apiConfig } from '../../src/services/api.config';
import {
    addContractorToStaff,
    fetchContractors,
    fetchEmployees,
    fetchStaff,
    inviteContractor,
    inviteEmployee,
    removeStaffMember,
    searchContractors,
    updateStaffMember,
} from '../../src/services/staff/staffService';
import type { Contractor, Employee } from '../../src/types/staff';

jest.mock('../../src/services/api.config', () => ({
  apiConfig: {
    baseURL: 'https://api.test.com',
    authenticatedFetch: jest.fn(),
  },
}));

const mockAuthenticatedFetch = apiConfig.authenticatedFetch as jest.MockedFunction<
  typeof apiConfig.authenticatedFetch
>;

describe('CRUD - Employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmployee: Employee = {
    id: 'emp-001',
    firstName: 'John',
    lastName: 'Driver',
    email: 'john.driver@company.com',
    phone: '+61412345678',
    role: 'driver',
    type: 'employee',
    status: 'active',
    hireDate: '2024-01-15',
    avatar: 'https://example.com/avatar.jpg',
    skills: ['driving', 'heavy-lifting'],
    availability: 'full-time',
    payRate: 35,
    payType: 'hourly',
  };

  // ===================================
  // employee_read_list
  // ===================================
  describe('employee_read_list', () => {
    it('should fetch list of employees successfully', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ employees: [mockEmployee] }),
      } as Response);

      const result = await fetchEmployees();

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
      expect(result[0].type).toBe('employee');
    });

    it('should handle empty employee list', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ employees: [] }),
      } as Response);

      const result = await fetchEmployees();

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(fetchEmployees()).rejects.toThrow('Failed to fetch employees');
    });
  });

  // ===================================
  // employee_invite
  // ===================================
  describe('employee_invite', () => {
    it('should invite new employee via email', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ employeeId: 'emp-002' }),
      } as Response);

      const result = await inviteEmployee({
        email: 'new.employee@test.com',
        firstName: 'Jane',
        lastName: 'Helper',
        role: 'helper',
      });

      expect(result.success).toBe(true);
      expect(result.employeeId).toBe('emp-002');
    });

    it('should fail invitation on API error', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(
        inviteEmployee({
          email: 'invalid',
          firstName: '',
          lastName: '',
          role: 'driver',
        })
      ).rejects.toThrow('Failed to send employee invitation');
    });
  });

  // ===================================
  // employee_update
  // ===================================
  describe('employee_update', () => {
    it('should update employee information', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          member: { ...mockEmployee, phone: '+61499999999' },
        }),
      } as Response);

      const result = await updateStaffMember('emp-001', {
        phone: '+61499999999',
      });

      expect(result.success).toBe(true);
      expect(result.member.phone).toBe('+61499999999');
    });

    it('should update employee role', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          member: { ...mockEmployee, role: 'supervisor' },
        }),
      } as Response);

      const result = await updateStaffMember('emp-001', {
        role: 'supervisor',
      });

      expect(result.member.role).toBe('supervisor');
    });
  });

  // ===================================
  // employee_delete
  // ===================================
  describe('employee_delete', () => {
    it('should remove employee from staff', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await removeStaffMember('emp-001');

      expect(result.success).toBe(true);
    });

    it('should fail deletion on API error', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      await expect(removeStaffMember('emp-001')).rejects.toThrow(
        'Failed to remove staff member'
      );
    });
  });

  // ===================================
  // employee_validation
  // ===================================
  describe('employee_validation', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('john.driver@company.com')).toBe(true);
      expect(isValidEmail('test@test.com.au')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
    });

    it('should validate phone format (Australian)', () => {
      const isValidPhone = (phone: string): boolean => {
        const regex = /^(\+61|0)[0-9]{9}$/;
        return regex.test(phone.replace(/\s/g, ''));
      };

      expect(isValidPhone('+61412345678')).toBe(true);
      expect(isValidPhone('0412345678')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });

    it('should validate employee roles', () => {
      const validRoles = ['driver', 'helper', 'supervisor', 'technician', 'admin'];
      const isValidRole = (role: string): boolean => validRoles.includes(role);

      expect(isValidRole('driver')).toBe(true);
      expect(isValidRole('supervisor')).toBe(true);
      expect(isValidRole('unknown')).toBe(false);
    });
  });
});

describe('CRUD - Contractors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContractor: Contractor = {
    id: 'cont-001',
    firstName: 'Bob',
    lastName: 'Mover',
    email: 'bob.mover@contractor.com',
    phone: '+61487654321',
    role: 'driver',
    type: 'contractor',
    status: 'active',
    avatar: 'https://example.com/bob.jpg',
    skills: ['driving', 'furniture-assembly'],
    availability: 'on-call',
    abn: '12345678901',
    companyName: 'Bob Movers Pty Ltd',
    contractStatus: 'active',
    hourlyRate: 45,
  };

  // ===================================
  // contractor_read_list
  // ===================================
  describe('contractor_read_list', () => {
    it('should fetch list of contractors successfully', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contractors: [mockContractor] }),
      } as Response);

      const result = await fetchContractors();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('contractor');
      expect(result[0].abn).toBe('12345678901');
    });
  });

  // ===================================
  // contractor_search
  // ===================================
  describe('contractor_search', () => {
    it('should search contractors by name', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockContractor] }),
      } as Response);

      const result = await searchContractors('Bob');

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Bob');
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Bob')
      );
    });

    it('should return empty array when no matches', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      const result = await searchContractors('NonExistent');

      expect(result).toEqual([]);
    });
  });

  // ===================================
  // contractor_invite
  // ===================================
  describe('contractor_invite', () => {
    it('should invite contractor via email', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Invitation envoyée à contractor@test.com',
        }),
      } as Response);

      const result = await inviteContractor(
        'contractor@test.com',
        'New',
        'Contractor'
      );

      expect(result.success).toBe(true);
    });
  });

  // ===================================
  // contractor_add_to_staff
  // ===================================
  describe('contractor_add_to_staff', () => {
    it('should add contractor to company staff', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contractor: mockContractor }),
      } as Response);

      const result = await addContractorToStaff('cont-001', 'active');

      expect(result.success).toBe(true);
      expect(result.contractor.contractStatus).toBe('active');
    });
  });

  // ===================================
  // contractor_validation
  // ===================================
  describe('contractor_validation', () => {
    it('should validate ABN format (11 digits)', () => {
      const isValidABN = (abn: string): boolean => {
        // ABN must be exactly 11 digits
        const cleaned = abn.replace(/\s/g, '');
        return /^\d{11}$/.test(cleaned);
      };

      expect(isValidABN('12345678901')).toBe(true);
      expect(isValidABN('12 345 678 901')).toBe(true);
      expect(isValidABN('1234567890')).toBe(false); // 10 digits
      expect(isValidABN('123456789012')).toBe(false); // 12 digits
      expect(isValidABN('abcdefghijk')).toBe(false);
    });

    it('should validate contract status values', () => {
      const validStatuses = ['pending', 'active', 'paused', 'terminated'];
      const isValidStatus = (status: string): boolean => validStatuses.includes(status);

      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('invalid')).toBe(false);
    });

    it('should validate hourly rate is positive', () => {
      const isValidRate = (rate: number): boolean => {
        return rate > 0;
      };

      expect(isValidRate(45)).toBe(true);
      expect(isValidRate(0)).toBe(false);
      expect(isValidRate(-10)).toBe(false);
    });
  });
});

describe('CRUD - All Staff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================================
  // staff_read_all
  // ===================================
  describe('staff_read_all', () => {
    it('should fetch all staff (employees + contractors)', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          staff: [
            {
              id: 'emp-001',
              firstName: 'John',
              lastName: 'Driver',
              type: 'employee',
            },
            {
              id: 'cont-001',
              firstName: 'Bob',
              lastName: 'Mover',
              type: 'contractor',
            },
          ],
        }),
      } as Response);

      const result = await fetchStaff();

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.type === 'employee')).toBeDefined();
      expect(result.find((s) => s.type === 'contractor')).toBeDefined();
    });
  });
});
