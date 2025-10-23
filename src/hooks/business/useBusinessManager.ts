/**
 * useBusinessManager - Hook composite pour la gestion globale de l'entreprise
 * Combine tous les hooks business pour une gestion centralisée
 */
import { useBusinessInfo } from './useBusinessInfo';
import { useBusinessStaff } from './useBusinessStaff';
import { useBusinessVehicles } from './useBusinessVehicles';
import { useInvoices } from './useInvoices';
import { useJobTemplates } from './useJobTemplates';

interface BusinessManagerReturn {
  // Informations entreprise
  business: ReturnType<typeof useBusinessInfo>;
  
  // Véhicules
  vehicles: ReturnType<typeof useBusinessVehicles>;
  
  // Templates de jobs
  templates: ReturnType<typeof useJobTemplates>;
  
  // Factures
  invoices: ReturnType<typeof useInvoices>;
  
  // Personnel
  staff: ReturnType<typeof useBusinessStaff>;
  
  // État global
  isAnyLoading: boolean;
  hasAnyError: boolean;
  
  // Actions globales
  refreshAll: () => Promise<void>;
  clearAllErrors: () => void;
  
  // Statistiques globales
  getBusinessOverview: () => {
    totalEmployees: number;
    totalVehicles: number;
    totalTemplates: number;
    totalInvoices: number;
    totalRevenue: number;
    pendingInvoices: number;
    activeVehicles: number;
    activeStaff: number;
  };
}

export const useBusinessManager = (companyId: string = 'swift-removals-001'): BusinessManagerReturn => {
  // Hooks individuels
  const business = useBusinessInfo();
  const vehicles = useBusinessVehicles(companyId);
  const templates = useJobTemplates();
  const invoices = useInvoices();
  const staff = useBusinessStaff();

  // États globaux dérivés
  const isAnyLoading = 
    business.isLoading || 
    vehicles.isLoading || 
    templates.isLoading || 
    invoices.isLoading || 
    staff.isLoading;

  const hasAnyError = !!(
    business.error || 
    vehicles.error || 
    templates.error || 
    invoices.error || 
    staff.error
  );

  /**
   * Actualise toutes les données
   */
  const refreshAll = async (): Promise<void> => {
    await Promise.all([
      business.refreshData(),
      vehicles.refreshVehicles(),
      templates.refreshTemplates(),
      invoices.refreshInvoices(),
      staff.refreshStaff(),
    ]);
  };

  /**
   * Efface toutes les erreurs
   */
  const clearAllErrors = (): void => {
    business.clearError();
    vehicles.clearError();
    templates.clearError();
    invoices.clearError();
    staff.clearError();
  };

  /**
   * Calcule un aperçu global de l'entreprise
   */
  const getBusinessOverview = () => {
    const vehicleStats = vehicles.getVehicleStats();
    const templateStats = templates.getTemplateStats();
    const invoiceStats = invoices.getInvoiceStats();
    
    return {
      totalEmployees: staff.staffStats?.total || 0,
      totalVehicles: vehicleStats.total,
      totalTemplates: templateStats.total,
      totalInvoices: invoiceStats.total,
      totalRevenue: invoiceStats.totalAmount,
      pendingInvoices: invoiceStats.pending,
      activeVehicles: vehicleStats.active,
      activeStaff: staff.staffStats?.active || 0,
    };
  };

  return {
    // Hooks individuels
    business,
    vehicles,
    templates,
    invoices,
    staff,
    
    // État global
    isAnyLoading,
    hasAnyError,
    
    // Actions globales
    refreshAll,
    clearAllErrors,
    
    // Statistiques globales
    getBusinessOverview,
  };
};