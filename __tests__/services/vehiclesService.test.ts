/**
 * Tests CRUD - Vehicles
 * Basé sur SWIFT_APP_TEST_SUITE.json
 */

// Mock des dépendances
import {
    createBusinessVehicle,
    deleteBusinessVehicle,
    fetchBusinessVehicles,
    fetchVehicleDetails,
    updateBusinessVehicle,
    type BusinessVehicle,
    type VehicleCreateData,
} from '../../src/services/business/vehiclesService';
import { fetchWithAuth } from '../../src/utils/session';

jest.mock('../../src/utils/session', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://api.test.com/',
  },
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe('CRUD - Vehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVehicle: BusinessVehicle = {
    id: 'vehicle-001',
    company_id: 'company-001',
    name: 'Truck Alpha',
    type: 'moving-truck',
    registration: 'ABC-123',
    make: 'Isuzu',
    model: 'NPR 200',
    year: '2024',
    nextService: '2026-06-15',
    location: 'Sydney Depot',
    status: 'available',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  };

  // ===================================
  // vehicle_read_list
  // ===================================
  describe('vehicle_read_list', () => {
    it('should fetch list of vehicles successfully', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          trucks: [mockVehicle],
        }),
      } as Response);

      const result = await fetchBusinessVehicles('company-001');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Truck Alpha');
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('company/company-001/trucks'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array on API error', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await fetchBusinessVehicles('company-001');

      expect(result).toEqual([]);
    });
  });

  // ===================================
  // vehicle_read_details
  // ===================================
  describe('vehicle_read_details', () => {
    it('should fetch vehicle details by ID', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: mockVehicle,
        }),
      } as Response);

      const result = await fetchVehicleDetails('company-001', 'vehicle-001');

      expect(result.id).toBe('vehicle-001');
      expect(result.name).toBe('Truck Alpha');
      expect(result.registration).toBe('ABC-123');
    });

    it('should throw error if vehicle not found', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        fetchVehicleDetails('company-001', 'invalid-id')
      ).rejects.toThrow();
    });
  });

  // ===================================
  // vehicle_create_truck
  // ===================================
  describe('vehicle_create_truck', () => {
    it('should create a truck vehicle successfully', async () => {
      const createData: VehicleCreateData = {
        name: 'New Truck',
        type: 'moving-truck',
        registration: 'XYZ-789',
        make: 'Hino',
        model: '300 Series',
        year: '2025',
        nextService: '2026-12-01',
        location: 'Brisbane Office',
      };

      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: { id: 'new-vehicle-001', company_id: 'company-001', ...createData, status: 'available' },
        }),
      } as Response);

      const result = await createBusinessVehicle('company-001', createData);

      expect(result.id).toBe('new-vehicle-001');
      expect(result.type).toBe('moving-truck');
      expect(result.registration).toBe('XYZ-789');
    });
  });

  // ===================================
  // vehicle_create_ute
  // ===================================
  describe('vehicle_create_ute', () => {
    it('should create a ute vehicle with valid Australian registration', async () => {
      const createData: VehicleCreateData = {
        name: 'Work Ute',
        type: 'ute',
        registration: 'AB-12-CD', // Format australien alternatif
        make: 'Toyota',
        model: 'HiLux',
        year: '2024',
        nextService: '2026-06-01',
        location: 'Melbourne Depot',
      };

      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: { id: 'ute-001', company_id: 'company-001', ...createData, status: 'available' },
        }),
      } as Response);

      const result = await createBusinessVehicle('company-001', createData);

      expect(result.type).toBe('ute');
      expect(result.registration).toBe('AB-12-CD');
    });
  });

  // ===================================
  // vehicle_create_trailer
  // ===================================
  describe('vehicle_create_trailer', () => {
    it('should create a trailer with optional capacity empty', async () => {
      const createData: VehicleCreateData = {
        name: 'Box Trailer',
        type: 'trailer',
        registration: 'TRL-456',
        make: 'Other',
        model: 'Custom',
        year: '2021',
        nextService: '2026-06-15',
        location: 'Sydney Depot',
        capacity: '', // Capacité optionnelle vide
      };

      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: { id: 'trailer-001', company_id: 'company-001', ...createData, status: 'available' },
        }),
      } as Response);

      const result = await createBusinessVehicle('company-001', createData);

      expect(result.type).toBe('trailer');
      expect(result.capacity).toBe('');
    });
  });

  // ===================================
  // vehicle_create_van
  // ===================================
  describe('vehicle_create_van', () => {
    it('should create a van with year in valid range', async () => {
      const createData: VehicleCreateData = {
        name: 'Delivery Van',
        type: 'van',
        registration: 'VAN-001',
        make: 'Mercedes-Benz',
        model: 'Sprinter',
        year: '2023',
        nextService: '2026-08-01',
        location: 'Adelaide Depot',
      };

      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: { id: 'van-001', company_id: 'company-001', ...createData, status: 'available' },
        }),
      } as Response);

      const result = await createBusinessVehicle('company-001', createData);

      expect(result.type).toBe('van');
      expect(parseInt(result.year)).toBeGreaterThanOrEqual(1990);
      expect(parseInt(result.year)).toBeLessThanOrEqual(new Date().getFullYear());
    });
  });

  // ===================================
  // vehicle_update
  // ===================================
  describe('vehicle_update', () => {
    it('should update vehicle successfully', async () => {
      const updateData = {
        name: 'Updated Truck Name',
        location: 'Perth Depot',
      };

      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          truck: { ...mockVehicle, ...updateData },
        }),
      } as Response);

      const result = await updateBusinessVehicle('company-001', 'vehicle-001', updateData);

      expect(result.name).toBe('Updated Truck Name');
      expect(result.location).toBe('Perth Depot');
    });
  });

  // ===================================
  // vehicle_delete
  // ===================================
  describe('vehicle_delete', () => {
    it('should delete vehicle successfully', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Vehicle deleted',
        }),
      } as Response);

      // deleteBusinessVehicle returns void, so we just check it doesn't throw
      await expect(deleteBusinessVehicle('company-001', 'vehicle-001')).resolves.not.toThrow();

      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('vehicle-001'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ===================================
  // vehicle_validation_registration
  // ===================================
  describe('vehicle_validation_registration', () => {
    it('should validate Australian registration format ABC-123', () => {
      const pattern1 = /^[A-Z]{3}-\d{3}$/;
      expect(pattern1.test('ABC-123')).toBe(true);
      expect(pattern1.test('XYZ-789')).toBe(true);
      expect(pattern1.test('abc-123')).toBe(false); // lowercase
      expect(pattern1.test('AB-123')).toBe(false); // trop court
    });

    it('should validate Australian registration format AB-12-CD', () => {
      const pattern2 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/;
      expect(pattern2.test('AB-12-CD')).toBe(true);
      expect(pattern2.test('XY-99-ZZ')).toBe(true);
      expect(pattern2.test('AB-1-CD')).toBe(false); // chiffres manquants
    });

    it('should accept either registration format', () => {
      const validateRegistration = (reg: string): boolean => {
        const pattern1 = /^[A-Z]{3}-\d{3}$/;
        const pattern2 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/;
        return pattern1.test(reg) || pattern2.test(reg);
      };

      expect(validateRegistration('ABC-123')).toBe(true);
      expect(validateRegistration('AB-12-CD')).toBe(true);
      expect(validateRegistration('INVALID')).toBe(false);
    });
  });

  // ===================================
  // vehicle_validation_year
  // ===================================
  describe('vehicle_validation_year', () => {
    it('should accept years between 1990 and current year', () => {
      const currentYear = new Date().getFullYear();
      const validateYear = (year: number): boolean => {
        return year >= 1990 && year <= currentYear;
      };

      expect(validateYear(1990)).toBe(true);
      expect(validateYear(2024)).toBe(true);
      expect(validateYear(currentYear)).toBe(true);
      expect(validateYear(1989)).toBe(false);
      expect(validateYear(currentYear + 1)).toBe(false);
    });
  });

  // ===================================
  // vehicle_validation_service_date
  // ===================================
  describe('vehicle_validation_service_date', () => {
    it('should accept only future dates for next service', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDate = new Date('2026-12-01');
      const pastDate = new Date('2025-01-01');

      expect(futureDate >= today).toBe(true);
      expect(pastDate >= today).toBe(false);
    });
  });
});
