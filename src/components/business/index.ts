/**
 * Business Components Index - Export central
 * RÈGLE 3 : Point d'entrée unique pour tous les composants business
 */

export { default as BusinessTabMenu } from './BusinessTabMenu';
export type { BusinessTabItem } from './BusinessTabMenu';

export { BusinessInlineLoading, default as BusinessLoadingState } from './BusinessLoadingState';
export { default as InvoiceCreateEditModal } from './InvoiceCreateEditModal';
export { PaymentsDashboard } from './PaymentsDashboard/PaymentsDashboard';

