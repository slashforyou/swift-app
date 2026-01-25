/**
 * Permission utilities for company role-based access control
 * Based on API v1.1.0 company/user relationship changes
 */

import type { CompanyRole } from "../services/user";

/**
 * Check if a user can create jobs based on their company role
 * Only 'patron' and 'cadre' can create jobs
 */
export function canCreateJob(companyRole?: CompanyRole): boolean {
  if (!companyRole) return false;
  return companyRole === "patron" || companyRole === "cadre";
}

/**
 * Check if a user can see all company jobs or only their assigned jobs
 * 'patron' and 'cadre' see all company jobs
 * 'employee' only sees their assigned jobs
 */
export function canSeeAllCompanyJobs(companyRole?: CompanyRole): boolean {
  if (!companyRole) return false;
  return companyRole === "patron" || companyRole === "cadre";
}

/**
 * Get the appropriate calendar label based on user role
 */
export function getCalendarLabel(companyRole?: CompanyRole): string {
  if (!companyRole) return "Calendrier";

  if (companyRole === "employee") {
    return "Mes jobs assignés";
  }

  return "Jobs de l'entreprise";
}

/**
 * Check if a user is a manager (patron or cadre)
 */
export function isManager(companyRole?: CompanyRole): boolean {
  if (!companyRole) return false;
  return companyRole === "patron" || companyRole === "cadre";
}

/**
 * Check if a user is the company owner
 */
export function isOwner(companyRole?: CompanyRole): boolean {
  return companyRole === "patron";
}

/**
 * Get permission error message for job creation
 */
export function getJobCreationErrorMessage(companyRole?: CompanyRole): string {
  if (!companyRole) {
    return "Utilisateur non associé à une entreprise";
  }

  if (companyRole === "employee") {
    return "Seuls les patrons et cadres peuvent créer des jobs";
  }

  return "Permission insuffisante";
}
