/**
 * StaffService - Service API pour la gestion du personnel
 * Note: Pas d'endpoints dédiés staff, utilise structure interne avec AsyncStorage
 * TODO: Connecter aux endpoints Job Crew quand disponible
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types Staff
export interface BusinessStaff {
  id: string;
  company_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tfn: string; // Tax File Number australien
  role: 'moving-supervisor' | 'senior-mover' | 'mover' | 'packing-specialist' | 'driver' | 'admin';
  team: 'local-moving-a' | 'local-moving-b' | 'interstate' | 'packing' | 'storage';
  hourlyRate: number;
  status: 'active' | 'inactive' | 'on-leave';
  startDate: string;
  skills: string[];
  certifications: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffCreateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tfn: string;
  role: 'moving-supervisor' | 'senior-mover' | 'mover' | 'packing-specialist' | 'driver' | 'admin';
  team: 'local-moving-a' | 'local-moving-b' | 'interstate' | 'packing' | 'storage';
  hourlyRate: number;
  startDate: string;
  skills: string[];
  certifications: string[];
  notes?: string;
}

// Clé de stockage local
const STAFF_STORAGE_KEY = '@business_staff';
const COMPANY_ID = 'swift-removals-001'; // ID fixe pour Swift Removals

/**
 * Génère un ID unique pour un nouveau staff
 */
const generateStaffId = (): string => {
  return `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Récupère la liste du personnel depuis le stockage local
 */
export const fetchBusinessStaff = async (): Promise<BusinessStaff[]> => {
  try {
    const staffData = await AsyncStorage.getItem(STAFF_STORAGE_KEY);
    
    if (!staffData) {
      return [];
    }

    const staff: BusinessStaff[] = JSON.parse(staffData);
    return staff.filter(s => s.company_id === COMPANY_ID);
  } catch (error) {
    console.error('Error fetching business staff:', error);
    throw new Error('Failed to fetch business staff');
  }
};

/**
 * Récupère les détails d'un membre du personnel par ID
 */
export const fetchStaffDetails = async (staffId: string): Promise<BusinessStaff> => {
  try {
    const allStaff = await fetchBusinessStaff();
    const staff = allStaff.find(s => s.id === staffId);
    
    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  } catch (error) {
    console.error('Error fetching staff details:', error);
    throw new Error('Failed to fetch staff details');
  }
};

/**
 * Crée un nouveau membre du personnel
 */
export const createBusinessStaff = async (staffData: StaffCreateData): Promise<BusinessStaff> => {
  try {
    const currentStaff = await fetchBusinessStaff();
    
    const newStaff: BusinessStaff = {
      ...staffData,
      id: generateStaffId(),
      company_id: COMPANY_ID,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedStaff = [...currentStaff, newStaff];
    await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));

    return newStaff;
  } catch (error) {
    console.error('Error creating business staff:', error);
    throw new Error('Failed to create business staff');
  }
};

/**
 * Met à jour un membre du personnel existant
 */
export const updateBusinessStaff = async (
  staffId: string,
  updates: Partial<StaffCreateData & { status: BusinessStaff['status'] }>
): Promise<BusinessStaff> => {
  try {
    const currentStaff = await fetchBusinessStaff();
    const staffIndex = currentStaff.findIndex(s => s.id === staffId);
    
    if (staffIndex === -1) {
      throw new Error('Staff member not found');
    }

    const updatedStaffMember: BusinessStaff = {
      ...currentStaff[staffIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentStaff[staffIndex] = updatedStaffMember;
    await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(currentStaff));

    return updatedStaffMember;
  } catch (error) {
    console.error('Error updating business staff:', error);
    throw new Error('Failed to update business staff');
  }
};

/**
 * Supprime un membre du personnel
 */
export const deleteBusinessStaff = async (staffId: string): Promise<void> => {
  try {
    const currentStaff = await fetchBusinessStaff();
    const filteredStaff = currentStaff.filter(s => s.id !== staffId);
    
    await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(filteredStaff));
  } catch (error) {
    console.error('Error deleting business staff:', error);
    throw new Error('Failed to delete business staff');
  }
};

/**
 * Archive/désactive un membre du personnel
 */
export const archiveBusinessStaff = async (staffId: string): Promise<BusinessStaff> => {
  return await updateBusinessStaff(staffId, { status: 'inactive' });
};

/**
 * Réactive un membre du personnel
 */
export const unarchiveBusinessStaff = async (staffId: string): Promise<BusinessStaff> => {
  return await updateBusinessStaff(staffId, { status: 'active' });
};

/**
 * Recherche du personnel par critères
 */
export const searchBusinessStaff = async (searchCriteria: {
  name?: string;
  role?: BusinessStaff['role'];
  team?: BusinessStaff['team'];
  status?: BusinessStaff['status'];
}): Promise<BusinessStaff[]> => {
  try {
    const allStaff = await fetchBusinessStaff();
    
    return allStaff.filter(staff => {
      const nameMatch = !searchCriteria.name || 
        `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchCriteria.name.toLowerCase());
      
      const roleMatch = !searchCriteria.role || staff.role === searchCriteria.role;
      const teamMatch = !searchCriteria.team || staff.team === searchCriteria.team;
      const statusMatch = !searchCriteria.status || staff.status === searchCriteria.status;
      
      return nameMatch && roleMatch && teamMatch && statusMatch;
    });
  } catch (error) {
    console.error('Error searching business staff:', error);
    throw new Error('Failed to search business staff');
  }
};

/**
 * Obtient les statistiques du personnel
 */
export const getStaffStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  byRole: Record<BusinessStaff['role'], number>;
  byTeam: Record<BusinessStaff['team'], number>;
  averageRate: number;
}> => {
  try {
    const allStaff = await fetchBusinessStaff();
    
    const stats = {
      total: allStaff.length,
      active: allStaff.filter(s => s.status === 'active').length,
      inactive: allStaff.filter(s => s.status === 'inactive').length,
      byRole: {} as Record<BusinessStaff['role'], number>,
      byTeam: {} as Record<BusinessStaff['team'], number>,
      averageRate: 0,
    };

    // Compter par rôle
    allStaff.forEach(staff => {
      stats.byRole[staff.role] = (stats.byRole[staff.role] || 0) + 1;
      stats.byTeam[staff.team] = (stats.byTeam[staff.team] || 0) + 1;
    });

    // Calculer le taux moyen
    if (allStaff.length > 0) {
      const totalRate = allStaff.reduce((sum, staff) => sum + staff.hourlyRate, 0);
      stats.averageRate = Math.round((totalRate / allStaff.length) * 100) / 100;
    }

    return stats;
  } catch (error) {
    console.error('Error getting staff stats:', error);
    throw new Error('Failed to get staff statistics');
  }
};