/**
 * Staff Service - API Service pour la gestion du personnel
 * Remplace les données mock par de vraies APIs REST
 */

import { apiConfig } from '../../services/api.config';
import { Contractor, Employee, InviteEmployeeData, StaffMember } from '../../types/staff';

/**
 * Récupère tous les membres du personnel
 */
export const fetchStaff = async (): Promise<StaffMember[]> => {
  try {
    // TEMP_DISABLED: console.log('🌐 [staffService] Fetching all staff members...');
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Retrieved ${data.staff.length} staff members`);
    
    return data.staff;
  } catch (error) {
    // Propager l'erreur silencieusement, le hook gère le fallback
    throw new Error('Failed to fetch staff members');
  }
};

/**
 * Récupère uniquement les employés
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    // TEMP_DISABLED: console.log('🌐 [staffService] Fetching employees...');
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/employees`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Retrieved ${data.employees.length} employees`);
    
    return data.employees;
  } catch (error) {
    throw new Error('Failed to fetch employees');
  }
};

/**
 * Récupère uniquement les prestataires
 */
export const fetchContractors = async (): Promise<Contractor[]> => {
  try {
    // TEMP_DISABLED: console.log('🌐 [staffService] Fetching contractors...');
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/contractors`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Retrieved ${data.contractors.length} contractors`);
    
    return data.contractors;
  } catch (error) {
    throw new Error('Failed to fetch contractors');
  }
};

/**
 * Envoie une invitation à un employé
 */
export const inviteEmployee = async (employeeData: InviteEmployeeData): Promise<{ success: boolean; employeeId: string }> => {
  try {
    // TEMP_DISABLED: console.log('📧 [staffService] Sending employee invitation to:', employeeData.email);
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/employees/invite`, {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Employee invitation sent, ID: ${data.employeeId}`);
    
    return {
      success: true,
      employeeId: data.employeeId,
    };
  } catch (error) {
    throw new Error('Failed to send employee invitation');
  }
};

/**
 * Recherche des prestataires disponibles
 */
export const searchContractors = async (searchTerm: string): Promise<Contractor[]> => {
  try {
    // TEMP_DISABLED: console.log('🔍 [staffService] Searching contractors:', searchTerm);
    
    const params = new URLSearchParams({
      q: searchTerm,
      limit: '20',
    });

    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/contractors/search?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Found ${data.results.length} contractors`);
    
    return data.results;
  } catch (error) {
    throw new Error('Failed to search contractors');
  }
};

/**
 * Ajoute un prestataire au personnel
 */
export const addContractorToStaff = async (
  contractorId: string, 
  contractStatus: Contractor['contractStatus']
): Promise<{ success: boolean; contractor: Contractor }> => {
  try {
    // TEMP_DISABLED: console.log('🤝 [staffService] Adding contractor to staff:', contractorId, contractStatus);
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/contractors/add`, {
      method: 'POST',
      body: JSON.stringify({
        contractorId,
        contractStatus,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Contractor added to staff successfully`);
    
    return {
      success: true,
      contractor: data.contractor,
    };
  } catch (error) {
    throw new Error('Failed to add contractor to staff');
  }
};

/**
 * Met à jour les informations d'un membre du personnel
 */
export const updateStaffMember = async (
  staffId: string, 
  updateData: Partial<StaffMember>
): Promise<{ success: boolean; member: StaffMember }> => {
  try {
    // TEMP_DISABLED: console.log('📝 [staffService] Updating staff member:', staffId);
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Staff member updated successfully`);
    
    return {
      success: true,
      member: data.member,
    };
  } catch (error) {
    throw new Error('Failed to update staff member');
  }
};

/**
 * Supprime un membre du personnel
 */
export const removeStaffMember = async (staffId: string): Promise<{ success: boolean }> => {
  try {
    // TEMP_DISABLED: console.log('🗑️ [staffService] Removing staff member:', staffId);
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/${staffId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // TEMP_DISABLED: console.log(`✅ [staffService] Staff member removed successfully`);
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to remove staff member');
  }
};

/**
 * Envoie une invitation à un prestataire (contractor)
 * Le prestataire recevra un email pour créer un compte avec son ABN
 */
export const inviteContractor = async (
  email: string, 
  firstName: string, 
  lastName: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // TEMP_DISABLED: console.log('📧 [staffService] Sending contractor invitation to:', email);
    
    const response = await apiConfig.authenticatedFetch(`${apiConfig.baseURL}/api/staff/contractors/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log(`✅ [staffService] Contractor invitation sent to: ${email}`);
    
    return {
      success: true,
      message: data.message || `Invitation envoyée à ${email}`,
    };
  } catch (error) {
    throw new Error('Failed to send contractor invitation');
  }
};

// Export des fonctions principales pour compatibilité
export const staffService = {
  fetchStaff,
  fetchEmployees,
  fetchContractors,
  inviteEmployee,
  inviteContractor,
  searchContractors,
  addContractorToStaff,
  updateStaffMember,
  removeStaffMember,
};
