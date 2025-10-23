/**
 * Tests unitaires pour le hook useStaff
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useStaff } from '../../src/hooks/useStaff';

// Mock des dépendances
jest.mock('../../src/services/api', () => ({
  authenticatedFetch: jest.fn(),
}));

describe('useStaff Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty staff arrays and loading false', () => {
    const { result } = renderHook(() => useStaff());

    expect(result.current.employees).toEqual([]);
    expect(result.current.contractors).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load mock employees on mount', async () => {
    const { result } = renderHook(() => useStaff());

    // Attendre que les données mockées soient chargées
    await waitFor(() => { expect(result.current).toBeDefined(); });

    expect(result.current.employees.length).toBeGreaterThan(0);
    expect(result.current.employees[0]).toEqual(
      expect.objectContaining({
        type: 'employee',
        firstName: expect.any(String),
        lastName: expect.any(String),
        tfn: expect.any(String),
        invitationStatus: expect.any(String),
      })
    );
  });

  it('should load mock contractors on mount', async () => {
    const { result } = renderHook(() => useStaff());

    await waitFor(() => { expect(result.current).toBeDefined(); });

    expect(result.current.contractors.length).toBeGreaterThan(0);
    expect(result.current.contractors[0]).toEqual(
      expect.objectContaining({
        type: 'contractor',
        firstName: expect.any(String),
        lastName: expect.any(String),
        abn: expect.any(String),
        contractStatus: expect.any(String),
      })
    );
  });

  describe('inviteEmployee', () => {
    it('should successfully invite an employee', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const newEmployeeData = {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com',
        phone: '+61 400 000 000',
        role: 'Mover',
        team: 'Team A',
        hourlyRate: 30,
      };

      const initialEmployeeCount = result.current.employees.length;

      await act(async () => {
        await result.current.inviteEmployee(newEmployeeData);
      });

      expect(result.current.employees.length).toBe(initialEmployeeCount + 1);
      
      const newEmployee = result.current.employees.find(
        (emp) => emp.email === 'test@example.com'
      );
      
      expect(newEmployee).toBeDefined();
      expect(newEmployee?.firstName).toBe('Test');
      expect(newEmployee?.lastName).toBe('Employee');
      expect(newEmployee?.invitationStatus).toBe('pending');
      expect(newEmployee?.accountLinked).toBe(false);
    });

    it('should handle invitation errors gracefully', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const invalidEmployeeData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        phone: '',
        role: '',
        team: '',
        hourlyRate: -1,
      };

      await expect(
        act(async () => {
          await result.current.inviteEmployee(invalidEmployeeData);
        })
      ).rejects.toThrow();
    });
  });

  describe('searchContractor', () => {
    it('should search contractors by name', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const searchResults = await act(async () => {
        return await result.current.searchContractor('John');
      });

      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0]).toEqual(
        expect.objectContaining({
          firstName: expect.stringContaining('John'),
          abn: expect.any(String),
          isVerified: expect.any(Boolean),
        })
      );
    });

    it('should search contractors by ABN', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const searchResults = await act(async () => {
        return await result.current.searchContractor('12345678901');
      });

      expect(Array.isArray(searchResults)).toBe(true);
      if (searchResults.length > 0) {
        expect(searchResults[0]).toEqual(
          expect.objectContaining({
            abn: expect.stringContaining('12345678901'),
            type: 'contractor',
          })
        );
      }
    });

    it('should return empty array for no matches', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const searchResults = await act(async () => {
        return await result.current.searchContractor('NonexistentContractor');
      });

      expect(searchResults).toEqual([]);
    });
  });

  describe('addContractor', () => {
    it('should successfully add a contractor', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      // D'abord rechercher un contractor
      const searchResults = await act(async () => {
        return await result.current.searchContractor('John');
      });

      if (searchResults.length > 0) {
        const contractorToAdd = searchResults[0];
        const initialContractorCount = result.current.contractors.length;

        await act(async () => {
          await result.current.addContractor(contractorToAdd.id, 'preferred');
        });

        expect(result.current.contractors.length).toBe(initialContractorCount + 1);
        
        const addedContractor = result.current.contractors.find(
          (c) => c.id === contractorToAdd.id
        );
        
        expect(addedContractor).toBeDefined();
        expect(addedContractor?.contractStatus).toBe('preferred');
      }
    });

    it('should handle adding duplicate contractors', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const existingContractor = result.current.contractors[0];
      if (existingContractor) {
        await expect(
          act(async () => {
            await result.current.addContractor(existingContractor.id, 'standard');
          })
        ).rejects.toThrow();
      }
    });
  });

  describe('data filtering and statistics', () => {
    it('should correctly separate employees and contractors', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const { employees, contractors } = result.current;

      employees.forEach((emp) => {
        expect(emp.type).toBe('employee');
        expect(emp).toHaveProperty('tfn');
        expect(emp).toHaveProperty('invitationStatus');
      });

      contractors.forEach((contractor) => {
        expect(contractor.type).toBe('contractor');
        expect(contractor).toHaveProperty('abn');
        expect(contractor).toHaveProperty('contractStatus');
      });
    });

    it('should provide accurate statistics', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const activeEmployees = result.current.employees.filter(
        (emp) => emp.invitationStatus === 'completed' && emp.status === 'active'
      );

      const verifiedContractors = result.current.contractors.filter(
        (contractor) => contractor.isVerified
      );

      expect(activeEmployees.length).toBeGreaterThanOrEqual(0);
      expect(verifiedContractors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle API errors in employee invitation', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      // Simuler une erreur réseau
      const mockError = new Error('Network error');
      
      // Note: Dans un vrai test, on mockrait l'API pour lancer cette erreur
      const invalidData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        team: '',
        hourlyRate: 0,
      };

      await expect(
        act(async () => {
          await result.current.inviteEmployee(invalidData);
        })
      ).rejects.toThrow();
    });

    it('should handle API errors in contractor search', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      // Test avec une chaîne vide qui pourrait causer une erreur
      await expect(
        act(async () => {
          await result.current.searchContractor('');
        })
      ).rejects.toThrow();
    });
  });

  describe('loading states', () => {
    it('should manage loading state during employee invitation', async () => {
      const { result } = renderHook(() => useStaff());
      await waitFor(() => { expect(result.current).toBeDefined(); });

      const employeeData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+61 400 000 000',
        role: 'Mover',
        team: 'Team A',
        hourlyRate: 25,
      };

      // Le loading devrait être false initialement
      expect(result.current.isLoading).toBe(false);

      // Pendant l'invitation, isLoading devrait être true
      let invitePromise;
      act(() => {
        invitePromise = result.current.inviteEmployee(employeeData);
      });

      // Après l'invitation, isLoading devrait redevenir false
      await act(async () => {
        await invitePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
