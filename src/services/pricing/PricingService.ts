/**
 * PricingService.ts - Service centralisé pour le calcul des prix
 *
 * ⚠️ SOURCE UNIQUE DE VÉRITÉ pour tous les calculs de facturation
 *
 * Utilisation:
 * ```typescript
 * import { PricingService } from '../services/pricing';
 *
 * // Calcul simple
 * const result = PricingService.calculatePrice(timeBreakdown, config);
 *
 * // Calcul en temps réel (dans un composant)
 * const livePrice = PricingService.calculateLivePrice(totalElapsedMs, stepTimes, config);
 * ```
 */

import { StepType } from "../../constants/JobStepsConfig";
import {
  AdditionalItem,
  DEFAULT_PRICING_CONFIG,
  formatCurrency,
  formatHoursReadable,
  formatTime,
  Invoice,
  JobPricingConfig,
  msToHours,
  PricingResult,
  TimeBreakdown,
  TravelBillingMode,
} from "./PricingConfig";

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class PricingService {
  /**
   * Calcule le prix basé sur la décomposition temporelle
   *
   * Gère 3 modes de facturation transport:
   * 1. DEPOT_TO_DEPOT: Le client paye du départ dépôt au retour (travelRate × travelHours)
   * 2. FIXED_TRAVEL_FEE: Le client paye un forfait fixe (fixedTravelFeeHours ou fixedTravelFeeAmount)
   * 3. NOT_BILLABLE: Le temps de trajet n'est pas facturé
   */
  static calculatePrice(
    timeBreakdown: TimeBreakdown,
    config: Partial<JobPricingConfig> = {},
  ): PricingResult {
    // Merge avec config par défaut
    const fullConfig: JobPricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      ...config,
    };

    const travelRate = fullConfig.travelRate ?? fullConfig.hourlyRate;
    const billingMode =
      fullConfig.travelBillingMode ?? TravelBillingMode.DEPOT_TO_DEPOT;

    // Convertir en heures
    const travelHours = msToHours(timeBreakdown.travelTimeMs);
    const workHours = msToHours(timeBreakdown.workTimeMs);
    const pauseHours = msToHours(timeBreakdown.pauseTimeMs);

    // ========================================================================
    // 🚛 Calculer les heures de trajet facturables selon le mode
    // ========================================================================
    let billableTravelHours = 0;
    let fixedTravelFee = 0;

    switch (billingMode) {
      case TravelBillingMode.DEPOT_TO_DEPOT:
        // Mode classique: facture le temps réel de trajet
        billableTravelHours = travelHours;
        break;

      case TravelBillingMode.FIXED_TRAVEL_FEE:
        // Mode forfait: ne facture pas le temps réel, ajoute un forfait fixe
        billableTravelHours = 0; // Le temps de trajet réel n'est PAS facturé

        // Calcul du forfait
        if (fullConfig.fixedTravelFeeAmount !== undefined) {
          // Montant fixe en dollars
          fixedTravelFee = fullConfig.fixedTravelFeeAmount;
        } else if (fullConfig.fixedTravelFeeHours !== undefined) {
          // Montant en heures × taux horaire
          fixedTravelFee = fullConfig.fixedTravelFeeHours * fullConfig.hourlyRate;
        }
        break;

      case TravelBillingMode.NOT_BILLABLE:
        // Le trajet n'est pas facturé du tout
        billableTravelHours = 0;
        break;

      default:
        // Fallback sur legacy behavior
        billableTravelHours = fullConfig.travelTimeIsBillable ? travelHours : 0;
    }

    // ========================================================================
    // Calculer les heures de travail facturables
    // ========================================================================
    const billableWorkHours = workHours;
    const billablePauseHours = fullConfig.pauseTimeIsBillable ? pauseHours : 0;

    // Total brut (avant ajustements)
    let rawBillableHours =
      billableTravelHours + billableWorkHours - (pauseHours - billablePauseHours);

    // S'assurer que c'est positif
    rawBillableHours = Math.max(0, rawBillableHours);

    const hoursBeforeRounding = rawBillableHours;
    let billableHours = rawBillableHours;

    // Appliquer le minimum
    let minimumApplied = false;
    if (billableHours < fullConfig.minimumHours && billableHours > 0) {
      billableHours = fullConfig.minimumHours;
      minimumApplied = true;
    }

    // Appliquer l'arrondi à la demi-heure
    let roundingApplied = false;
    if (fullConfig.roundToHalfHour && billableHours > 0) {
      const originalHours = billableHours;
      billableHours = this.roundToHalfHour(
        billableHours,
        fullConfig.roundingThresholdMinutes,
      );
      roundingApplied = billableHours !== originalHours;
    }

    // ========================================================================
    // Calculer les coûts
    // ========================================================================
    const laborCost = billableHours * fullConfig.hourlyRate;

    // Coût de trajet additionnel (si taux différent en mode DEPOT_TO_DEPOT)
    let travelCost = 0;
    if (
      billingMode === TravelBillingMode.DEPOT_TO_DEPOT &&
      travelRate !== fullConfig.hourlyRate
    ) {
      travelCost = billableTravelHours * (travelRate - fullConfig.hourlyRate);
    }

    // En mode FIXED_TRAVEL_FEE, ajouter le forfait
    if (billingMode === TravelBillingMode.FIXED_TRAVEL_FEE) {
      travelCost = fixedTravelFee;
    }

    const subtotal = laborCost + travelCost;
    const total = subtotal + fullConfig.callOutFee;

    return {
      // Temps
      rawHours: msToHours(timeBreakdown.totalElapsedMs),
      billableHours,
      travelHours,
      workHours,
      pauseHours,

      // Coûts
      laborCost,
      travelCost,
      callOutFee: fullConfig.callOutFee,
      subtotal,
      total,

      // Détails
      minimumApplied,
      roundingApplied,
      hoursBeforeRounding,

      // Métadonnées
      currency: fullConfig.currency,
      hourlyRate: fullConfig.hourlyRate,
      travelRate,
    };
  }

  /**
   * Arrondit les heures à la demi-heure selon la règle du seuil
   *
   * Règle des 7 minutes:
   * - 0-6 min → arrondi à 0
   * - 7-36 min → arrondi à 30 min
   * - 37-66 min → arrondi à 60 min (1h)
   */
  static roundToHalfHour(hours: number, thresholdMinutes: number = 7): number {
    const totalMinutes = hours * 60;
    const wholeHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Seuil en minutes (par défaut 7)
    const threshold = thresholdMinutes;

    if (remainingMinutes < threshold) {
      // Arrondi vers le bas
      return wholeHours;
    } else if (remainingMinutes < 30 + threshold) {
      // Arrondi à la demi-heure
      return wholeHours + 0.5;
    } else {
      // Arrondi à l'heure supérieure
      return wholeHours + 1;
    }
  }

  /**
   * Calcule le prix en temps réel à partir des step times
   *
   * @param totalElapsedMs - Temps total écoulé
   * @param stepTimes - Historique des temps par étape
   * @param steps - Configuration des steps (pour identifier trajet vs travail)
   * @param pauseTimeMs - Temps de pause total
   * @param config - Configuration de pricing
   */
  static calculateLivePrice(
    totalElapsedMs: number,
    stepTimes: Array<{
      step: number;
      stepName: string;
      startTime: number;
      endTime?: number;
      duration?: number;
    }>,
    steps: Array<{ id: number; type: string }>,
    pauseTimeMs: number = 0,
    config: Partial<JobPricingConfig> = {},
  ): PricingResult {
    // Calculer le temps par type de step
    let travelTimeMs = 0;
    let workTimeMs = 0;

    for (const stepTime of stepTimes) {
      const stepConfig = steps.find((s) => s.id === stepTime.step);
      const duration = stepTime.duration || 0;

      if (!stepConfig) continue;

      // Identifier si c'est un trajet ou du travail
      if (
        stepConfig.type === StepType.TRAVEL_TO_ADDRESS ||
        stepConfig.type === StepType.TRAVEL_RETURN
      ) {
        travelTimeMs += duration;
      } else if (
        stepConfig.type === StepType.AT_ADDRESS ||
        stepConfig.type === StepType.ARRIVAL_END
      ) {
        workTimeMs += duration;
      }
      // NOT_STARTED n'est pas compté
    }

    // Si le step actuel est en cours (pas de endTime), ajouter le temps courant
    if (stepTimes.length > 0) {
      const lastStep = stepTimes[stepTimes.length - 1];
      if (!lastStep.endTime && lastStep.startTime) {
        const ongoingDuration = Date.now() - lastStep.startTime;
        const stepConfig = steps.find((s) => s.id === lastStep.step);

        if (stepConfig) {
          if (
            stepConfig.type === StepType.TRAVEL_TO_ADDRESS ||
            stepConfig.type === StepType.TRAVEL_RETURN
          ) {
            travelTimeMs += ongoingDuration;
          } else if (
            stepConfig.type === StepType.AT_ADDRESS ||
            stepConfig.type === StepType.ARRIVAL_END
          ) {
            workTimeMs += ongoingDuration;
          }
        }
      }
    }

    const timeBreakdown: TimeBreakdown = {
      totalElapsedMs,
      travelTimeMs,
      workTimeMs,
      pauseTimeMs,
    };

    return this.calculatePrice(timeBreakdown, config);
  }

  /**
   * Calcul simplifié pour compatibilité avec l'ancien code
   * (ne différencie pas trajet/travail)
   */
  static calculateSimplePrice(
    totalElapsedMs: number,
    pauseTimeMs: number = 0,
    config: Partial<JobPricingConfig> = {},
  ): PricingResult {
    const timeBreakdown: TimeBreakdown = {
      totalElapsedMs,
      travelTimeMs: 0,
      workTimeMs: totalElapsedMs - pauseTimeMs,
      pauseTimeMs,
    };

    return this.calculatePrice(timeBreakdown, config);
  }

  /**
   * Génère une facture complète
   */
  static generateInvoice(
    job: any,
    pricing: PricingResult,
    additionalItems: AdditionalItem[] = [],
    taxRate: number = 0,
  ): Invoice {
    const additionalTotal = additionalItems.reduce(
      (sum, item) => sum + item.amount * (item.quantity || 1),
      0,
    );
    const subtotal = pricing.total + additionalTotal;
    const tax = taxRate > 0 ? subtotal * taxRate : 0;
    const total = subtotal + tax;

    return {
      // Identification
      jobId: job?.id?.toString() || "",
      jobCode: job?.code || job?.job?.code || "",
      createdAt: new Date().toISOString(),

      // Client
      clientName:
        `${job?.client?.firstName || ""} ${job?.client?.lastName || ""}`.trim() ||
        "Client",
      clientEmail: job?.client?.email,
      clientPhone: job?.client?.phone,
      clientAddress: job?.addresses?.[0]?.street,

      // Pricing
      pricing,
      additionalItems,

      // Totaux
      subtotal,
      tax: tax > 0 ? tax : undefined,
      taxRate: taxRate > 0 ? taxRate : undefined,
      total,

      // Statut
      status: job?.isPaid ? "paid" : "pending",
      paidAt: job?.paidAt,
      paymentMethod: job?.paymentMethod,
    };
  }

  /**
   * Extrait la config de pricing depuis un objet job
   */
  static getConfigFromJob(job: any): Partial<JobPricingConfig> {
    return {
      hourlyRate: job?.hourlyRate || job?.pricing?.hourlyRate,
      travelRate: job?.travelRate || job?.pricing?.travelRate,
      currency: job?.currency || job?.pricing?.currency,
      minimumHours: job?.minimumHours || job?.pricing?.minimumHours,
      callOutFee: job?.callOutFee || job?.pricing?.callOutFee,
      roundToHalfHour: job?.pricing?.roundToHalfHour,
      roundingThresholdMinutes: job?.pricing?.roundingThresholdMinutes,
      travelTimeIsBillable: job?.pricing?.travelTimeIsBillable,
      pauseTimeIsBillable: job?.pricing?.pauseTimeIsBillable,
    };
  }

  // ============================================================================
  // UTILITAIRES EXPORTÉS
  // ============================================================================

  static formatCurrency = formatCurrency;
  static formatTime = formatTime;
  static formatHoursReadable = formatHoursReadable;
  static msToHours = msToHours;
}

// ============================================================================
// HOOK REACT POUR CALCUL EN TEMPS RÉEL
// ============================================================================

import { useCallback, useMemo } from "react";

/**
 * Hook pour utiliser le PricingService dans un composant React
 */
export function usePricing(config: Partial<JobPricingConfig> = {}) {
  const fullConfig = useMemo(
    () => ({
      ...DEFAULT_PRICING_CONFIG,
      ...config,
    }),
    [config],
  );

  const calculatePrice = useCallback(
    (timeBreakdown: TimeBreakdown) => {
      return PricingService.calculatePrice(timeBreakdown, fullConfig);
    },
    [fullConfig],
  );

  const calculateSimplePrice = useCallback(
    (totalElapsedMs: number, pauseTimeMs: number = 0) => {
      return PricingService.calculateSimplePrice(
        totalElapsedMs,
        pauseTimeMs,
        fullConfig,
      );
    },
    [fullConfig],
  );

  const calculateLivePrice = useCallback(
    (
      totalElapsedMs: number,
      stepTimes: any[],
      steps: any[],
      pauseTimeMs: number = 0,
    ) => {
      return PricingService.calculateLivePrice(
        totalElapsedMs,
        stepTimes,
        steps,
        pauseTimeMs,
        fullConfig,
      );
    },
    [fullConfig],
  );

  return {
    config: fullConfig,
    calculatePrice,
    calculateSimplePrice,
    calculateLivePrice,
    formatCurrency: (amount: number) =>
      formatCurrency(amount, fullConfig.currency),
    formatTime,
    formatHoursReadable,
  };
}
