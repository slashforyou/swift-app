/**
 * JobStepsConfig.ts - Configuration centralisée et UNIQUE des steps de job
 *
 * ⚠️ C'est LA SOURCE UNIQUE DE VÉRITÉ pour les steps !
 *
 * Règles métier (pour 2 adresses) :
 * - Step 0 : Pas commencé
 * - Step 1 : Trajet vers Adresse 1
 * - Step 2 : Adresse 1 (travail sur place)
 * - Step 3 : Trajet vers Adresse 2
 * - Step 4 : Adresse 2 (travail sur place) → PAIEMENT
 * - Step 5 : Trajet retour
 * - Step 6 : Arrivée/Fin
 *
 * Formule : Pour N adresses → Total steps = 1 + 2×N + 2 (trajet retour + arrivée)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types de steps possibles
 */
export enum StepType {
  NOT_STARTED = "NOT_STARTED", // Step 0
  TRAVEL_TO_ADDRESS = "TRAVEL_TO_ADDRESS", // Trajet vers une adresse
  AT_ADDRESS = "AT_ADDRESS", // Travail à une adresse
  TRAVEL_RETURN = "TRAVEL_RETURN", // Trajet retour
  ARRIVAL_END = "ARRIVAL_END", // Arrivée/Fin
}

/**
 * Configuration d'un step
 */
export interface JobStepConfig {
  id: number; // Numéro du step (0, 1, 2, ...)
  type: StepType; // Type de step
  name: string; // Nom affiché
  shortName: string; // Nom court pour UI compacte
  description: string; // Description détaillée
  icon: string; // Icône Ionicons
  color: string; // Couleur hex
  addressIndex?: number; // Index de l'adresse (pour TRAVEL_TO/AT_ADDRESS)
  isPaymentStep: boolean; // Si c'est le step de paiement
  isOptional: boolean; // Si le step peut être sauté
  isFinal: boolean; // Si c'est le dernier step (bloque retour)
}

/**
 * État d'un step dans le contexte d'un job
 */
export type StepStatus = "pending" | "current" | "completed";

/**
 * Step avec son état
 */
export interface JobStepWithStatus extends JobStepConfig {
  status: StepStatus;
  startedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  duration?: number; // Durée en ms
}

// ============================================================================
// COULEURS DES STEPS
// ============================================================================

export const STEP_COLORS = {
  notStarted: "#6B7280", // Gris
  travelTo: "#3B82F6", // Bleu - Trajet vers
  atAddress: "#8B5CF6", // Violet - Travail à l'adresse
  payment: "#F59E0B", // Orange - Step paiement
  travelReturn: "#10B981", // Vert - Trajet retour
  arrivalEnd: "#EC4899", // Rose - Arrivée/Fin
  completed: "#10B981", // Vert
} as const;

// ============================================================================
// ICÔNES DES STEPS
// ============================================================================

export const STEP_ICONS = {
  notStarted: "pause-circle-outline",
  travelTo: "car-outline", // Trajet vers
  atAddress: "construct-outline", // Travail sur place
  payment: "card-outline",
  travelReturn: "return-down-back-outline", // Trajet retour
  arrivalEnd: "flag-outline", // Arrivée/Fin
} as const;

// ============================================================================
// GÉNÉRATION DYNAMIQUE DES STEPS
// ============================================================================

/**
 * Génère la liste des steps pour un job basé sur ses adresses
 *
 * Nouvelle logique (pour 2 adresses):
 * - Step 0: Pas commencé
 * - Step 1: Trajet vers Adresse 1
 * - Step 2: Adresse 1 (travail)
 * - Step 3: Trajet vers Adresse 2
 * - Step 4: Adresse 2 (travail) → PAIEMENT
 * - Step 5: Trajet retour
 * - Step 6: Arrivée/Fin
 *
 * @param addresses - Liste des adresses du job
 * @param includeReturnToDepot - Si le retour au dépôt est inclus (défaut: true)
 * @param t - Fonction de traduction (optionnelle)
 * @returns Liste des configurations de steps
 */
export function generateStepsFromAddresses(
  addresses: any[],
  includeReturnToDepot: boolean = true,
  t?: (key: string) => string,
): JobStepConfig[] {
  const translate = t || ((key: string) => key);
  const steps: JobStepConfig[] = [];

  const addressCount = addresses?.length || 2; // Minimum 2 adresses par défaut

  // Step 0 : Pas commencé
  steps.push({
    id: 0,
    type: StepType.NOT_STARTED,
    name: translate("jobSteps.notStarted"),
    shortName: translate("jobSteps.notStartedShort"),
    description: translate("jobSteps.notStartedDesc"),
    icon: STEP_ICONS.notStarted,
    color: STEP_COLORS.notStarted,
    isPaymentStep: false,
    isOptional: false,
    isFinal: false,
  });

  // Pour chaque adresse : Trajet vers + Travail à
  for (let i = 0; i < addressCount; i++) {
    const addressNumber = i + 1;
    const isLastAddress = i === addressCount - 1;
    const address = addresses?.[i];
    const addressLabel =
      address?.street || translate("jobSteps.address") + ` ${addressNumber}`;

    // Step Trajet vers l'adresse
    const travelStepId = 1 + i * 2;
    steps.push({
      id: travelStepId,
      type: StepType.TRAVEL_TO_ADDRESS,
      name: translate("jobSteps.travelToAddress").replace(
        "{n}",
        String(addressNumber),
      ),
      shortName: translate("jobSteps.travelToAddressShort").replace(
        "{n}",
        String(addressNumber),
      ),
      description: translate("jobSteps.travelToAddressDesc").replace(
        "{address}",
        addressLabel,
      ),
      icon: STEP_ICONS.travelTo,
      color: STEP_COLORS.travelTo,
      addressIndex: i,
      isPaymentStep: false,
      isOptional: false,
      isFinal: false,
    });

    // Step Travail à l'adresse
    const atAddressStepId = 2 + i * 2;
    steps.push({
      id: atAddressStepId,
      type: StepType.AT_ADDRESS,
      name: translate("jobSteps.atAddress").replace(
        "{n}",
        String(addressNumber),
      ),
      shortName: translate("jobSteps.atAddressShort").replace(
        "{n}",
        String(addressNumber),
      ),
      description: translate("jobSteps.atAddressDesc").replace(
        "{address}",
        addressLabel,
      ),
      icon: isLastAddress ? STEP_ICONS.payment : STEP_ICONS.atAddress,
      color: isLastAddress ? STEP_COLORS.payment : STEP_COLORS.atAddress,
      addressIndex: i,
      isPaymentStep: isLastAddress, // Paiement sur la dernière adresse
      isOptional: false,
      isFinal: false,
    });
  }

  // Step Trajet retour (optionnel)
  if (includeReturnToDepot) {
    const travelReturnStepId = 1 + addressCount * 2;
    steps.push({
      id: travelReturnStepId,
      type: StepType.TRAVEL_RETURN,
      name: translate("jobSteps.travelReturn"),
      shortName: translate("jobSteps.travelReturnShort"),
      description: translate("jobSteps.travelReturnDesc"),
      icon: STEP_ICONS.travelReturn,
      color: STEP_COLORS.travelReturn,
      isPaymentStep: false,
      isOptional: true, // Peut être annulé si enchaînement de jobs
      isFinal: false,
    });

    // Step Arrivée/Fin
    const arrivalEndStepId = 2 + addressCount * 2;
    steps.push({
      id: arrivalEndStepId,
      type: StepType.ARRIVAL_END,
      name: translate("jobSteps.arrivalEnd"),
      shortName: translate("jobSteps.arrivalEndShort"),
      description: translate("jobSteps.arrivalEndDesc"),
      icon: STEP_ICONS.arrivalEnd,
      color: STEP_COLORS.arrivalEnd,
      isPaymentStep: false,
      isOptional: false,
      isFinal: true, // Dernier step, pas de retour possible
    });
  }

  return steps;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Calcule le nombre total de steps pour un nombre d'adresses donné
 *
 * Nouvelle formule (pour N adresses):
 * - Step 0: Pas commencé
 * - Steps 1 à 2N: Trajet + Travail pour chaque adresse
 * - Steps 2N+1 et 2N+2: Trajet retour + Arrivée/Fin
 *
 * Total = 2N + 3 (avec retour) ou 2N + 1 (sans retour)
 *
 * @param addressCount - Nombre d'adresses
 * @param includeReturnToDepot - Si le retour est inclus
 * @returns Nombre total de steps (ID du dernier step, car on commence à 0)
 */
export function calculateTotalSteps(
  addressCount: number,
  includeReturnToDepot: boolean = true,
): number {
  // Pour 2 adresses: 0,1,2,3,4,5,6 = 7 steps, dernier ID = 6
  // Formule: 2×N + 2 (avec retour et fin) ou 2×N (sans retour)
  const baseSteps = addressCount * 2; // Trajet + Travail par adresse
  return includeReturnToDepot ? baseSteps + 2 : baseSteps;
}

/**
 * Trouve le step de paiement
 *
 * @param addressCount - Nombre d'adresses
 * @returns ID du step de paiement (dernier step "Adresse X")
 */
export function getPaymentStepId(addressCount: number): number {
  // Paiement = Travail dernière adresse = 2×N
  return addressCount * 2;
}

/**
 * Vérifie si on peut avancer au step suivant
 *
 * @param currentStep - Step actuel
 * @param targetStep - Step cible
 * @param totalSteps - Nombre total de steps
 * @returns true si on peut avancer
 */
export function canAdvanceToStep(
  currentStep: number,
  targetStep: number,
  totalSteps: number,
): boolean {
  // On ne peut avancer que d'un step à la fois, et jamais reculer
  return targetStep === currentStep + 1 && targetStep < totalSteps;
}

/**
 * Vérifie si le job est terminé (step final atteint)
 *
 * @param currentStep - Step actuel
 * @param steps - Liste des steps
 * @returns true si le job est terminé
 */
export function isJobCompleted(
  currentStep: number,
  steps: JobStepConfig[],
): boolean {
  const currentStepConfig = steps.find((s) => s.id === currentStep);
  return currentStepConfig?.isFinal === true;
}

/**
 * Vérifie si c'est le step de paiement
 *
 * @param currentStep - Step actuel
 * @param steps - Liste des steps
 * @returns true si c'est le step de paiement
 */
export function isPaymentStep(
  currentStep: number,
  steps: JobStepConfig[],
): boolean {
  const currentStepConfig = steps.find((s) => s.id === currentStep);
  return currentStepConfig?.isPaymentStep === true;
}

/**
 * Obtient le statut d'un step par rapport au step actuel
 *
 * @param stepId - ID du step à vérifier
 * @param currentStep - Step actuel du job
 * @returns Status du step
 */
export function getStepStatus(stepId: number, currentStep: number): StepStatus {
  if (stepId < currentStep) return "completed";
  if (stepId === currentStep) return "current";
  return "pending";
}

/**
 * Génère les steps avec leur statut actuel
 *
 * @param addresses - Liste des adresses
 * @param currentStep - Step actuel
 * @param includeReturnToDepot - Si le retour est inclus
 * @param t - Fonction de traduction
 * @returns Steps avec leur statut
 */
export function generateStepsWithStatus(
  addresses: any[],
  currentStep: number,
  includeReturnToDepot: boolean = true,
  t?: (key: string) => string,
): JobStepWithStatus[] {
  const steps = generateStepsFromAddresses(addresses, includeReturnToDepot, t);

  return steps.map((step) => ({
    ...step,
    status: getStepStatus(step.id, currentStep),
  }));
}

/**
 * Obtient le nom d'un step par son ID
 *
 * @param stepId - ID du step
 * @param steps - Liste des steps
 * @returns Nom du step
 */
export function getStepName(stepId: number, steps: JobStepConfig[]): string {
  const step = steps.find((s) => s.id === stepId);
  return step?.name || `Step ${stepId}`;
}

/**
 * Obtient la configuration d'un step par son ID
 *
 * @param stepId - ID du step
 * @param steps - Liste des steps
 * @returns Configuration du step ou undefined
 */
export function getStepConfig(
  stepId: number,
  steps: JobStepConfig[],
): JobStepConfig | undefined {
  return steps.find((s) => s.id === stepId);
}

// ============================================================================
// EXPORT PAR DÉFAUT - Steps pour 2 adresses (cas le plus courant)
// ============================================================================

export const DEFAULT_STEPS = generateStepsFromAddresses(
  [{ street: "Adresse de départ" }, { street: "Adresse d'arrivée" }],
  true,
);

export const DEFAULT_TOTAL_STEPS = DEFAULT_STEPS.length;
