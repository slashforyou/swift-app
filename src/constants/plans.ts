/**
 * plans.ts — Source de vérité pour les plans et taux de commission
 *
 * Pour le lancement MVP, seul le plan "free" est publiquement exposé.
 * Les plans pro/enterprise sont préparés mais masqués dans l'onboarding.
 */

export type PlanType = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanType;
  /** Taux de commission prélevé sur chaque paiement (ex: 0.03 = 3%) */
  commissionRate: number;
  /** Frais minimum en AUD (en centimes pour Stripe) */
  minFeeAud: number;
  /** Visible dans l'onboarding public */
  publiclyAvailable: boolean;
}

/** Taux de commission par plan — source de vérité frontend */
export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: "free",
    commissionRate: 0.03, // 3%
    minFeeAud: 0.5, // minimum $0.50 AUD
    publiclyAvailable: true,
  },
  pro: {
    id: "pro",
    commissionRate: 0, // 0% — inclus dans l'abonnement $99/mo
    minFeeAud: 0,
    publiclyAvailable: false, // masqué au lancement
  },
  enterprise: {
    id: "enterprise",
    commissionRate: 0, // 0% — inclus dans l'abonnement $179/mo
    minFeeAud: 0,
    publiclyAvailable: false, // masqué au lancement
  },
};

/**
 * Calcule le frais de plateforme pour un montant donné.
 * @param amountAud — montant total du job en AUD
 * @param planType  — plan de l'entreprise (défaut: "free")
 * @returns frais de plateforme en AUD (arrondi à 2 décimales)
 */
export function calculatePlatformFee(
  amountAud: number,
  planType: PlanType = "free",
): number {
  const plan = PLANS[planType] ?? PLANS.free;
  const fee = amountAud * plan.commissionRate;
  return Math.max(plan.minFeeAud, Math.round(fee * 100) / 100);
}

/**
 * Retourne le taux de commission formaté pour affichage (ex: "3%")
 */
export function formatCommissionRate(planType: PlanType = "free"): string {
  const plan = PLANS[planType] ?? PLANS.free;
  return `${plan.commissionRate * 100}%`;
}
