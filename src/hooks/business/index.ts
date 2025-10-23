/**
 * Index des hooks business
 * Hooks React pour la gestion complète de l'entreprise
 */

// Hooks business principaux
export { useBusinessInfo } from './useBusinessInfo';
export { useBusinessStaff } from './useBusinessStaff';
export { useBusinessVehicles } from './useBusinessVehicles';
export { useInvoices } from './useInvoices';
export { useJobTemplates } from './useJobTemplates';

// Hook composite
export { useBusinessManager } from './useBusinessManager';

// Types des hooks (pour faciliter l'usage)
export type {
    BusinessInfo, BusinessStaff, BusinessStats,
    BusinessVehicle, Invoice, InvoiceCreateData, InvoiceItem, JobTemplate, StaffCreateData, TemplateCreateData, VehicleCreateData
} from '../../services/business';
