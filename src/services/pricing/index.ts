/**
 * Pricing Service - Exports centralisés
 *
 * Usage:
 * ```typescript
 * import { PricingService, usePricing, DEFAULT_PRICING_CONFIG, TravelBillingMode } from '../services/pricing';
 * ```
 */

// Configuration et types
export {
  // Types
  type JobPricingConfig,
  type TimeBreakdown,
  type PricingResult,
  type AdditionalItem,
  type Invoice,
  // Enums
  TravelBillingMode,
  // Constantes
  DEFAULT_PRICING_CONFIG,
  LEGACY_PRICING_CONFIG,
  DEPOT_TO_DEPOT_PRICING_CONFIG,
  // Helpers
  msToHours,
  hoursToMs,
  formatCurrency,
  formatTime,
  formatHoursReadable,
} from "./PricingConfig";

// Service principal
export { PricingService, usePricing } from "./PricingService";
