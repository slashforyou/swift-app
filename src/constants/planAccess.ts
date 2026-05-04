export type AppPlanTier = "free" | "pro" | "expert" | "unlimited" | "enterprise" | "comped";

export type PlanFeatureKey =
  | "advanced_notifications"
  | "invoice_branding"
  | "inter_contractor_billing"
  | "priority_support";

const PLAN_ORDER: Record<AppPlanTier, number> = {
  free: 0,
  pro: 1,
  expert: 2,
  unlimited: 3,
  enterprise: 4,
  comped: 999, // plan offert — accès total à toutes les features
};

export const PLAN_FEATURE_RULES: Record<
  PlanFeatureKey,
  {
    minPlan: AppPlanTier;
    label: string;
    description: string;
  }
> = {
  advanced_notifications: {
    minPlan: "pro",
    label: "Notifications avancées",
    description: "Segments et ciblage fin des alertes push selon vos priorités.",
  },
  invoice_branding: {
    minPlan: "pro",
    label: "Branding des factures",
    description: "Logo/couleur de marque visibles sur vos factures et paiements.",
  },
  inter_contractor_billing: {
    minPlan: "pro",
    label: "Facturation inter-prestataires",
    description: "Suivi complet du statut de facturation entre partenaires.",
  },
  priority_support: {
    minPlan: "expert",
    label: "Support prioritaire",
    description: "Traitement accéléré de vos demandes critiques.",
  },
};

export function normalizePlanId(rawPlanId?: string | null): AppPlanTier {
  const id = String(rawPlanId || "").toLowerCase();

  if (id === "free") return "free";
  if (id === "pro") return "pro";
  if (id === "expert") return "expert";
  if (id === "unlimited") return "unlimited";
  if (id === "enterprise") return "enterprise";
  if (id === "comped") return "comped"; // plan offert

  return "free";
}

export function hasPlanAccess(
  currentPlan: AppPlanTier,
  requiredPlan: AppPlanTier,
): boolean {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan];
}
