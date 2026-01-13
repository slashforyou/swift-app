/**
 * Tests CRUD - Clients
 * Basé sur SWIFT_APP_TEST_SUITE.json
 */

// Mock des dépendances
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer test-token',
  }),
}));

jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://api.test.com/',
  },
}));

import {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,
  type ClientAPI,
  type CreateClientRequest,
} from '../../src/services/clients';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CRUD - Clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockClient: ClientAPI = {
    id: 'client-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+61412345678',
    address: {
      street: '123 Main St',
      city: 'Sydney',
      state: 'NSW',
      zip: '2000',
    },
    company: 'Smith & Co',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  };

  // ===================================
  // client_read_list
  // ===================================
  describe('client_read_list', () => {
    it('should fetch list of clients successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clients: [mockClient] }),
      });

      const result = await fetchClients();

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Smith');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/clients',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when no clients', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clients: [] }),
      });

      const result = await fetchClients();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(fetchClients()).rejects.toThrow('Server error');
    });
  });

  // ===================================
  // client_read_details
  // ===================================
  describe('client_read_details', () => {
    it('should fetch client by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ client: mockClient }),
      });

      const result = await fetchClientById('client-001');

      expect(result.id).toBe('client-001');
      expect(result.email).toBe('john.smith@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/client/client-001',
        expect.any(Object)
      );
    });

    it('should throw error when client not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Client not found' }),
      });

      await expect(fetchClientById('invalid-id')).rejects.toThrow('Client not found');
    });
  });

  // ===================================
  // client_create_success
  // ===================================
  describe('client_create_success', () => {
    it('should create a client successfully', async () => {
      const createData: CreateClientRequest = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+61498765432',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client: { id: 'client-002', ...createData, createdAt: '2026-01-13T10:00:00Z', updatedAt: '2026-01-13T10:00:00Z' },
        }),
      });

      const result = await createClient(createData);

      expect(result.id).toBe('client-002');
      expect(result.firstName).toBe('Jane');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/client',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid data' }),
      });

      await expect(
        createClient({
          firstName: '',
          lastName: '',
          email: 'invalid',
          phone: '',
        })
      ).rejects.toThrow('Invalid data');
    });
  });

  // ===================================
  // client_validation_email
  // ===================================
  describe('client_validation_email', () => {
    it('should validate correct email formats', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.com.au')).toBe(true);
      expect(isValidEmail('user+tag@gmail.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  // ===================================
  // client_validation_phone
  // ===================================
  describe('client_validation_phone', () => {
    it('should validate Australian phone formats', () => {
      const isValidAustralianPhone = (phone: string): boolean => {
        // +61 format or 04xx format
        const regex = /^(\+61|0)[0-9]{9}$/;
        return regex.test(phone.replace(/\s/g, ''));
      };

      expect(isValidAustralianPhone('+61412345678')).toBe(true);
      expect(isValidAustralianPhone('0412345678')).toBe(true);
      expect(isValidAustralianPhone('0412 345 678')).toBe(true);
      expect(isValidAustralianPhone('12345')).toBe(false);
    });
  });

  // ===================================
  // client_validation_name
  // ===================================
  describe('client_validation_name', () => {
    it('should validate client name is not empty', () => {
      const isValidName = (name: string): boolean => {
        return name.trim().length > 0;
      };

      expect(isValidName('John')).toBe(true);
      expect(isValidName('Jean-Pierre')).toBe(true);
      expect(isValidName("O'Connor")).toBe(true);
      expect(isValidName('')).toBe(false);
      expect(isValidName('   ')).toBe(false);
    });
  });

  // ===================================
  // client_update
  // ===================================
  describe('client_update', () => {
    it('should update client successfully', async () => {
      const updateData = {
        phone: '+61499999999',
        company: 'New Company',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client: { ...mockClient, ...updateData },
        }),
      });

      const result = await updateClient('client-001', updateData);

      expect(result.phone).toBe('+61499999999');
      expect(result.company).toBe('New Company');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/client/client-001',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  // ===================================
  // client_delete
  // ===================================
  describe('client_delete', () => {
    it('should delete client successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(deleteClient('client-001')).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/client/client-001',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Cannot delete client with active jobs' }),
      });

      await expect(deleteClient('client-001')).rejects.toThrow(
        'Cannot delete client with active jobs'
      );
    });
  });

  // ===================================
  // client_search
  // ===================================
  describe('client_search', () => {
    it('should filter clients by name', () => {
      const clients: ClientAPI[] = [
        { ...mockClient, id: '1', firstName: 'John', lastName: 'Smith', email: 'john@test.com' },
        { ...mockClient, id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        { ...mockClient, id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@test.com' },
      ];

      const searchClients = (query: string): ClientAPI[] => {
        const lowerQuery = query.toLowerCase();
        return clients.filter(
          (c) =>
            c.firstName.toLowerCase().includes(lowerQuery) ||
            c.lastName.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery)
        );
      };

      // 'john' matches: John Smith (firstName) and Bob Johnson (lastName)
      expect(searchClients('john')).toHaveLength(2);
      expect(searchClients('jane')).toHaveLength(1);
      expect(searchClients('test.com')).toHaveLength(3);
      expect(searchClients('xyz')).toHaveLength(0);
    });
  });

  // ===================================
  // client_create_inline
  // ===================================
  describe('client_create_inline', () => {
    it('should create client and return for job selection', async () => {
      const newClient: CreateClientRequest = {
        firstName: 'Quick',
        lastName: 'Client',
        email: 'quick@test.com',
        phone: '+61400000000',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client: {
            id: 'new-client-inline',
            ...newClient,
            createdAt: '2026-01-13T10:00:00Z',
            updatedAt: '2026-01-13T10:00:00Z',
          },
        }),
      });

      const result = await createClient(newClient);

      // Vérifie que le client créé peut être utilisé immédiatement
      expect(result.id).toBeDefined();
      expect(result.firstName).toBe('Quick');

      // Simule la sélection pour un job
      const selectedClientForJob = {
        id: result.id,
        name: `${result.firstName} ${result.lastName}`,
      };

      expect(selectedClientForJob.name).toBe('Quick Client');
    });
  });
});
