/**
 * Staff Service - API Service pour la gestion du personnel
 * Remplace les données mock par de vraies APIs REST
 */

import { ServerData } from "../../constants/ServerData";
import { apiConfig } from "../../services/api.config";
import {
    Contractor,
    Employee,
    InviteEmployeeData,
    StaffMember,
} from "../../types/staff";

const STAFF_API = ServerData.serverUrl;

/**
 * Récupère tous les membres du personnel
 */
export const fetchStaff = async (): Promise<StaffMember[]> => {
  try {

    const response = await apiConfig.authenticatedFetch(`${STAFF_API}v1/staff`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.staff;
  } catch (error) {
    // Propager l'erreur silencieusement, le hook gère le fallback
    throw new Error("Failed to fetch staff members");
  }
};

/**
 * Récupère uniquement les employés
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${STAFF_API}v1/staff?role=driver,helper,offsider`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.employees;
  } catch (error) {
    throw new Error("Failed to fetch employees");
  }
};

/**
 * Récupère uniquement les prestataires
 */
export const fetchContractors = async (): Promise<Contractor[]> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${STAFF_API}v1/staff/contractors`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.contractors;
  } catch (error) {
    throw new Error("Failed to fetch contractors");
  }
};

/**
 * Envoie une invitation à un employé
 */
export const inviteEmployee = async (
  employeeData: InviteEmployeeData,
): Promise<{ success: boolean; employeeId: string }> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/staff/employees/invite`,
      {
        method: "POST",
        body: JSON.stringify(employeeData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      employeeId: data.employeeId,
    };
  } catch (error) {
    throw new Error("Failed to send employee invitation");
  }
};

/**
 * Recherche des prestataires disponibles
 */
export const searchContractors = async (
  searchTerm: string,
): Promise<Contractor[]> => {
  try {

    const params = new URLSearchParams({
      q: searchTerm,
      limit: "20",
    });

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/contractors/search?${params}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.results;
  } catch (error) {
    throw new Error("Failed to search contractors");
  }
};

/**
 * Ajoute un prestataire au personnel
 */
export const addContractorToStaff = async (
  contractorId: string,
  contractStatus: Contractor["contractStatus"],
): Promise<{ success: boolean; contractor: Contractor }> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/staff/contractors/add`,
      {
        method: "POST",
        body: JSON.stringify({
          contractorId,
          contractStatus,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      contractor: data.contractor,
    };
  } catch (error) {
    throw new Error("Failed to add contractor to staff");
  }
};

/**
 * Met à jour les informations d'un membre du personnel
 */
export const updateStaffMember = async (
  staffId: string,
  updateData: Partial<StaffMember>,
): Promise<{ success: boolean; member: StaffMember }> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/staff/${staffId}`,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      member: data.member,
    };
  } catch (error) {
    throw new Error("Failed to update staff member");
  }
};

/**
 * Supprime un membre du personnel
 */
export const removeStaffMember = async (
  staffId: string,
): Promise<{ success: boolean }> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/staff/${staffId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }


    return { success: true };
  } catch (error) {
    throw new Error("Failed to remove staff member");
  }
};

/**
 * Envoie une invitation à un prestataire (contractor)
 * Le prestataire recevra un email pour créer un compte avec son ABN
 */
export const inviteContractor = async (
  email: string,
  firstName: string,
  lastName: string,
): Promise<{ success: boolean; message: string }> => {
  try {

    const response = await apiConfig.authenticatedFetch(
      `${apiConfig.baseURL}/api/staff/contractors/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email, firstName, lastName }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: data.message || `Invitation envoyée à ${email}`,
    };
  } catch (error) {
    throw new Error("Failed to send contractor invitation");
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
