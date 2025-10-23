/**
 * BusinessService - Service API pour la gestion d'entreprise
 * Endpoints Company Management
 */
import { ServerData } from '../../constants/ServerData';
import { fetchWithAuth } from '../../utils/session';

// Types Business
export interface BusinessInfo {
  id: string;
  name: string;
  abn?: string; // Australian Business Number
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  businessType: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessStats {
  totalEmployees: number;
  activeJobs: number;
  completedJobs: number;
  totalVehicles: number;
  activeVehicles: number;
  monthlyRevenue: number;
  averageJobValue: number;
}

// API Response Types
interface BusinessResponse {
  success: boolean;
  company: BusinessInfo;
  stats?: BusinessStats;
}

interface BusinessListResponse {
  success: boolean;
  companies: BusinessInfo[];
}

// Mock data pour fallback
const mockBusinessInfo: BusinessInfo = {
  id: 'swift-removals-001',
  name: 'Swift Removals',
  abn: '12 345 678 901',
  address: '123 Business Street',
  city: 'Sydney',
  state: 'NSW',
  postcode: '2000',
  phone: '+61 2 9000 0000',
  email: 'info@swiftremoval.com.au',
  businessType: 'Moving Services',
  website: 'www.swiftremoval.com.au',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-10-20T00:00:00Z'
};

const mockBusinessStats: BusinessStats = {
  totalEmployees: 8,
  activeJobs: 12,
  completedJobs: 145,
  totalVehicles: 5,
  activeVehicles: 4,
  monthlyRevenue: 85000,
  averageJobValue: 1250
};

/**
 * Récupère la liste des entreprises
 */
export const fetchBusinessList = async (): Promise<BusinessInfo[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/companies`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('API not available, using mock data');
      return [mockBusinessInfo];
    }

    const data: BusinessListResponse = await response.json();
    
    if (!data.success) {
      console.warn('API returned success: false, using mock data');
      return [mockBusinessInfo];
    }

    return data.companies || [mockBusinessInfo];
  } catch (error) {
    console.error('Error fetching business list:', error);
    console.warn('Using mock business data as fallback');
    return [mockBusinessInfo];
  }
};

/**
 * Récupère les détails d'une entreprise par ID
 */
export const fetchBusinessDetails = async (companyId: string): Promise<BusinessInfo> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('API not available, using mock data');
      return { ...mockBusinessInfo, id: companyId };
    }

    const data: BusinessResponse = await response.json();
    
    if (!data.success || !data.company) {
      console.warn('API returned invalid data, using mock data');
      return { ...mockBusinessInfo, id: companyId };
    }

    return data.company;
  } catch (error) {
    console.error('Error fetching business details:', error);
    console.warn('Using mock business details as fallback');
    return { ...mockBusinessInfo, id: companyId };
  }
};

/**
 * Met à jour les informations d'une entreprise
 */
export const updateBusinessInfo = async (
  companyId: string, 
  updates: Partial<Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>>
): Promise<BusinessInfo> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BusinessResponse = await response.json();
    
    if (!data.success || !data.company) {
      throw new Error('API returned invalid business data');
    }

    return data.company;
  } catch (error) {
    console.error('Error updating business info:', error);
    throw new Error('Failed to update business information');
  }
};

/**
 * Crée une nouvelle entreprise
 */
export const createBusiness = async (
  businessData: Omit<BusinessInfo, 'id' | 'created_at' | 'updated_at'>
): Promise<BusinessInfo> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BusinessResponse = await response.json();
    
    if (!data.success || !data.company) {
      throw new Error('API returned invalid business data');
    }

    return data.company;
  } catch (error) {
    console.error('Error creating business:', error);
    throw new Error('Failed to create business');
  }
};

/**
 * Supprime une entreprise
 */
/**
 * Récupère les statistiques d'une entreprise
 */
export const fetchBusinessStats = async (companyId: string): Promise<BusinessStats> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/stats`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('Stats API not available, using mock data');
      return mockBusinessStats;
    }

    const data = await response.json();
    
    if (!data.success || !data.stats) {
      console.warn('Stats API returned invalid data, using mock data');
      return mockBusinessStats;
    }

    return data.stats;
  } catch (error) {
    console.error('Error fetching business stats:', error);
    console.warn('Using mock business stats as fallback');
    return mockBusinessStats;
  }
};

export const deleteBusiness = async (companyId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    console.error('Error deleting business:', error);
    throw new Error('Failed to delete business');
  }
};