/**
 * PricingConfig.ts - Configuration centralisée pour le calcul des prix
 *
 * ⚠️ SOURCE UNIQUE DE VÉRITÉ pour toutes les règles de facturation
 *
 * Règles de facturation:
 * 1. Temps facturable = Temps travail + Temps trajet - Temps pause
 * 2. Minimum facturable (optionnel, défaut: 2h)
 * 3. Call-out fee (optionnel, défaut: 0)
 * 4. Arrondi à la demi-heure (règle des 7 min)
 *
 * 🚛 Modes de facturation du transport:
 * - DEPOT_TO_DEPOT: Le client paye du départ du dépôt au retour (travelRate = hourlyRate)
 * - FIXED_TRAVEL_FEE: Le client paye un forfait fixe pour le transport (ex: 30 min)
 *
 * 📝 TODO: Panneau de création de job
 * - [ ] Ajouter sélecteur "Mode de facturation transport" (DEPOT_TO_DEPOT / FIXED_TRAVEL_FEE)
 * - [ ] Si FIXED_TRAVEL_FEE: champ pour saisir le forfait fixe (en heures ou en $)
 * - [ ] Ajouter champ "Taux horaire" (défaut: 110 AUD)
 * - [ ] Ajouter champ "Minimum facturable" (défaut: 2h)
 * - [ ] Ajouter toggle "Appliquer call-out fee" + montant
 * - [ ] Ajouter toggle "Arrondi à la demi-heure" (règle des 7 min)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Mode de facturation du temps de transport
 */
export enum TravelBillingMode {
  /** Le client paye du départ dépôt au retour dépôt (travelRate = hourlyRate) */
  DEPOT_TO_DEPOT = "DEPOT_TO_DEPOT",
  /** Le client paye un forfait fixe pour le transport (ex: 30 min) */
  FIXED_TRAVEL_FEE = "FIXED_TRAVEL_FEE",
  /** Le temps de trajet n'est pas facturé (rare) */
  NOT_BILLABLE = "NOT_BILLABLE",
}

/**
 * Configuration de pricing pour un job
 */
export interface JobPricingConfig {
  // Taux horaires
  hourlyRate: number; // Taux horaire principal ($/h)
  travelRate?: number; // Taux pour le temps de trajet ($/h) - défaut = hourlyRate
  currency: string; // Devise (AUD, EUR, USD, etc.)

  // Règles de facturation
  minimumHours: number; // Minimum facturable (heures)
  callOutFee: number; // Frais de déplacement fixes ($)
  roundToHalfHour: boolean; // Arrondir à la demi-heure ?
  roundingThresholdMinutes: number; // Seuil d'arrondi (7 min = 0.117h)

  // 🚛 Options de facturation du transport
  travelBillingMode: TravelBillingMode; // Mode de facturation du transport
  fixedTravelFeeHours?: number; // Forfait fixe en heures (ex: 0.5 = 30 min) - si mode FIXED_TRAVEL_FEE
  fixedTravelFeeAmount?: number; // OU forfait fixe en $ - si mode FIXED_TRAVEL_FEE

  // Options legacy (pour compatibilité)
  travelTimeIsBillable: boolean; // Le trajet est-il facturable ? (dérivé de travelBillingMode)
  pauseTimeIsBillable: boolean; // Les pauses sont-elles facturables ? (généralement non)
}

/**
 * Données temporelles pour le calcul
 */
export interface TimeBreakdown {
  totalElapsedMs: number; // Temps total écoulé
  travelTimeMs: number; // Temps de trajet
  workTimeMs: number; // Temps de travail sur site
  pauseTimeMs: number; // Temps de pause
}

/**
 * Résultat du calcul de prix
 */
export interface PricingResult {
  // Temps
  rawHours: number; // Heures brutes (sans ajustements)
  billableHours: number; // Heures facturables (après règles)
  travelHours: number; // Heures de trajet
  workHours: number; // Heures de travail
  pauseHours: number; // Heures de pause

  // Coûts
  laborCost: number; // Coût main d'œuvre (hourlyRate × billableHours)
  travelCost: number; // Coût trajet (si taux différent)
  callOutFee: number; // Frais de déplacement
  subtotal: number; // Sous-total avant ajustements
  total: number; // Total final

  // Détails
  minimumApplied: boolean; // Le minimum a-t-il été appliqué ?
  roundingApplied: boolean; // L'arrondi a-t-il été appliqué ?
  hoursBeforeRounding: number; // Heures avant arrondi

  // Métadonnées
  currency: string;
  hourlyRate: number;
  travelRate: number;
}

/**
 * Élément additionnel sur la facture
 */
export interface AdditionalItem {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

/**
 * Facture complète
 */
export interface Invoice {
  // Identification
  jobId: string;
  jobCode: string;
  invoiceNumber?: string;
  createdAt: string;

  // Client
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;

  // Pricing
  pricing: PricingResult;
  additionalItems: AdditionalItem[];

  // Totaux
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;

  // Statut
  status: "draft" | "pending" | "paid" | "cancelled";
  paidAt?: string;
  paymentMethod?: string;
}

// ============================================================================
// VALEURS PAR DÉFAUT
// ============================================================================

/**
 * Configuration par défaut pour un nouveau job
 *
 * Mode par défaut: FIXED_TRAVEL_FEE (forfait transport 30 min)
 * → Le client paye un call-out fee de 30 min ($90)
 * → Minimum 2h de travail (total facturé minimum = 2h30)
 * → Arrondi à la demi-heure (règle des 7 min)
 */
export const DEFAULT_PRICING_CONFIG: JobPricingConfig = {
  // Taux horaires
  hourlyRate: 180, // $180 AUD/h
  travelRate: undefined, // Non utilisé en mode FIXED_TRAVEL_FEE
  currency: "AUD",

  // Règles de facturation
  minimumHours: 2, // Minimum 2 heures de travail (hors call-out fee)
  callOutFee: 90, // 30 min × $180 = $90 (frais de déplacement)
  roundToHalfHour: true, // Arrondir à la demi-heure
  roundingThresholdMinutes: 7, // Règle des 7 minutes (7-36 min → 30 min, 37+ → 1h)

  // 🚛 Mode de facturation transport: Forfait fixe (depot-to-depot désactivé)
  travelBillingMode: TravelBillingMode.FIXED_TRAVEL_FEE,
  fixedTravelFeeHours: 0.5, // 30 minutes de forfait inclus dans callOutFee
  fixedTravelFeeAmount: undefined, // Calculé via callOutFee

  // Options legacy
  travelTimeIsBillable: false, // Trajet NON facturable (remplacé par forfait)
  pauseTimeIsBillable: false, // Pauses NON facturables
};

/**
 * Configuration Depot-to-Depot
 *
 * Mode: DEPOT_TO_DEPOT
 * → Le client paye du départ du dépôt au retour au dépôt
 * → Tout le temps de trajet est facturé au taux horaire
 * → Pas de call-out fee séparé (tout est dans le temps)
 */
export const DEPOT_TO_DEPOT_PRICING_CONFIG: JobPricingConfig = {
  // Taux horaires
  hourlyRate: 180, // $180 AUD/h
  travelRate: undefined, // Même que hourlyRate
  currency: "AUD",

  // Règles de facturation
  minimumHours: 2, // Minimum 2 heures
  callOutFee: 0, // Pas de call-out fee (temps de trajet facturé)
  roundToHalfHour: true, // Arrondir à la demi-heure
  roundingThresholdMinutes: 7, // Règle des 7 minutes

  // 🚛 Mode de facturation transport: Depot to Depot
  travelBillingMode: TravelBillingMode.DEPOT_TO_DEPOT,
  fixedTravelFeeHours: undefined, // Non utilisé en mode DEPOT_TO_DEPOT
  fixedTravelFeeAmount: undefined, // Non utilisé en mode DEPOT_TO_DEPOT

  // Options legacy
  travelTimeIsBillable: true, // Trajet facturable
  pauseTimeIsBillable: false, // Pauses NON facturables
};

/**
 * Configuration legacy (ancien comportement pour compatibilité)
 * Note: Anciens taux à $110/h
 */
export const LEGACY_PRICING_CONFIG: JobPricingConfig = {
  hourlyRate: 110, // Ancien taux
  currency: "AUD",
  minimumHours: 2,
  callOutFee: 55, // 30 min × $110 = $55
  roundToHalfHour: true,
  roundingThresholdMinutes: 7,
  travelBillingMode: TravelBillingMode.FIXED_TRAVEL_FEE,
  fixedTravelFeeHours: 0.5,
  fixedTravelFeeAmount: undefined,
  travelTimeIsBillable: false,
  pauseTimeIsBillable: false,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convertit des millisecondes en heures
 */
export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

/**
 * Convertit des heures en millisecondes
 */
export function hoursToMs(hours: number): number {
  return hours * 1000 * 60 * 60;
}

/**
 * Formate un montant en devise
 */
export function formatCurrency(
  amount: number,
  currency: string = "AUD",
): string {
  const locale =
    currency === "AUD"
      ? "en-AU"
      : currency === "EUR"
        ? "fr-FR"
        : currency === "USD"
          ? "en-US"
          : "en-AU";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formate le temps en HH:MM:SS ou HH:MM
 */
export function formatTime(
  ms: number,
  includeSeconds: boolean = true,
): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (includeSeconds) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Formate les heures en format lisible (ex: "2h 30min")
 */
export function formatHoursReadable(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
