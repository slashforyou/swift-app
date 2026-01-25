/**
 * useCompanyPermissions - Hook for company role-based permissions
 * Based on API v1.1.0 company/user relationship changes
 *
 * This hook provides easy access to permission checks based on the user's
 * company role (patron, cadre, or employee)
 */

import * as SecureStore from "expo-secure-store";
import { useMemo } from "react";
import type { CompanyRole } from "../services/user";
import {
    canCreateJob,
    canSeeAllCompanyJobs,
    getCalendarLabel,
    getJobCreationErrorMessage,
    isManager,
    isOwner,
} from "../utils/permissions";

export interface CompanyPermissions {
  /** User's company role */
  companyRole?: CompanyRole;
  /** Company information */
  company?: {
    id: number;
    name: string;
  };
  /** Can the user create jobs? */
  canCreateJob: boolean;
  /** Can the user see all company jobs? */
  canSeeAllJobs: boolean;
  /** Is the user a manager (patron or cadre)? */
  isManager: boolean;
  /** Is the user the company owner? */
  isOwner: boolean;
  /** Get the appropriate calendar label */
  calendarLabel: string;
  /** Get error message for job creation restriction */
  getJobCreationError: () => string;
}

/**
 * Hook to get company-based permissions for the current user
 * Reads from stored user data after login
 */
export function useCompanyPermissions(): CompanyPermissions {
  // In a real implementation, this would read from a context or state management
  // For now, we'll create a helper to read from SecureStore
  // NOTE: This is synchronous in the hook but async operations should be done elsewhere

  // This hook assumes user data is already loaded in a context or state
  // You should integrate this with your existing auth context

  const permissions = useMemo(() => {
    // This is a placeholder - in real usage, get from auth context
    // For now, return default values
    const companyRole: CompanyRole | undefined = undefined;

    return {
      companyRole,
      company: undefined,
      canCreateJob: canCreateJob(companyRole),
      canSeeAllJobs: canSeeAllCompanyJobs(companyRole),
      isManager: isManager(companyRole),
      isOwner: isOwner(companyRole),
      calendarLabel: getCalendarLabel(companyRole),
      getJobCreationError: () => getJobCreationErrorMessage(companyRole),
    };
  }, []);

  return permissions;
}

/**
 * Helper function to get user data from storage
 * This should be called from a context or during app initialization
 */
export async function getUserCompanyData(): Promise<{
  companyRole?: CompanyRole;
  company?: { id: number; name: string };
  company_id?: number;
} | null> {
  try {
    const userData = await SecureStore.getItemAsync("user_data");
    if (userData) {
      const parsed = JSON.parse(userData);
      return {
        companyRole: parsed.company_role,
        company: parsed.company,
        company_id: parsed.company_id,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to get user company data:", error);
    return null;
  }
}

/**
 * Version with explicit user data parameter
 * Use this when you have user data from context
 */
export function getCompanyPermissions(
  companyRole?: CompanyRole,
  company?: { id: number; name: string },
): CompanyPermissions {
  return {
    companyRole,
    company,
    canCreateJob: canCreateJob(companyRole),
    canSeeAllJobs: canSeeAllCompanyJobs(companyRole),
    isManager: isManager(companyRole),
    isOwner: isOwner(companyRole),
    calendarLabel: getCalendarLabel(companyRole),
    getJobCreationError: () => getJobCreationErrorMessage(companyRole),
  };
}
