/**
 * Hooks index - Export de tous les hooks personnalisés
 */

export { useAuth, type User } from "./useAuth";
export { useDashboard } from "./useDashboard";
export {
    useModuleAccess,
    type ModuleAccess,
    type ModuleId
} from "./useModuleAccess";
export { useNavigation, type NavigationState } from "./useNavigation";
export { usePayouts } from "./usePayouts";
export { useStripeConnect } from "./useStripeConnect";

// Company permissions - API v1.1.0
export {
    getCompanyPermissions,
    getUserCompanyData,
    useCompanyPermissions,
    type CompanyPermissions
} from "./useCompanyPermissions";

// Permissions centralisées (user-level + job-level)
export {
    useAppPermissions,
    type AppPermissions,
    type JobPermissionGates,
    type JobPermissionInput
} from "./useAppPermissions";

