/**
 * useJobSteps - Hook pour gérer les steps d'un job de manière dynamique
 *
 * Utilise JobStepsConfig comme source unique de vérité
 */

import { useMemo } from "react";
import { useLocalization } from "../localization/useLocalization";
import {
  generateStepsWithStatus,
  getPaymentStepId,
  canAdvanceToStep,
  isJobCompleted,
  isPaymentStep,
  getStepStatus,
  getStepName,
  getStepConfig,
  JobStepConfig,
  JobStepWithStatus,
  StepStatus,
} from "../constants/JobStepsConfig";

interface UseJobStepsOptions {
  /** Liste des adresses du job */
  addresses: any[];
  /** Step actuel du job */
  currentStep: number;
  /** Si le retour au dépôt est inclus (défaut: true) */
  includeReturnToDepot?: boolean;
}

interface UseJobStepsReturn {
  /** Liste des steps avec leur statut */
  steps: JobStepWithStatus[];
  /** Nombre total de steps */
  totalSteps: number;
  /** Step actuel */
  currentStep: number;
  /** Configuration du step actuel */
  currentStepConfig: JobStepConfig | undefined;
  /** ID du step de paiement */
  paymentStepId: number;
  /** Si on est au step de paiement */
  isAtPaymentStep: boolean;
  /** Si le job est terminé */
  isCompleted: boolean;
  /** Pourcentage de progression (0-100) */
  progressPercentage: number;
  /** Peut-on avancer au step suivant ? */
  canAdvance: boolean;
  /** ID du prochain step */
  nextStepId: number | null;

  // Helpers
  /** Obtenir le statut d'un step */
  getStatus: (stepId: number) => StepStatus;
  /** Obtenir le nom d'un step */
  getName: (stepId: number) => string;
  /** Obtenir la config d'un step */
  getConfig: (stepId: number) => JobStepConfig | undefined;
  /** Vérifier si on peut aller à un step */
  canGoTo: (stepId: number) => boolean;
}

/**
 * Hook pour gérer les steps d'un job
 *
 * @example
 * ```tsx
 * const { steps, currentStep, canAdvance, isAtPaymentStep } = useJobSteps({
 *     addresses: job.addresses,
 *     currentStep: job.current_step || 0,
 * });
 * ```
 */
export function useJobSteps(options: UseJobStepsOptions): UseJobStepsReturn {
  const { t } = useLocalization();
  const { addresses, currentStep, includeReturnToDepot = true } = options;

  // Générer les steps avec traduction
  const stepsWithStatus = useMemo(() => {
    const translationFn = (key: string) => {
      // Traduire les clés de steps
      const translated = t(key);
      // Si la traduction n'existe pas, retourner une valeur par défaut
      return translated === key ? getDefaultTranslation(key) : translated;
    };

    return generateStepsWithStatus(
      addresses,
      currentStep,
      includeReturnToDepot,
      translationFn,
    );
  }, [addresses, currentStep, includeReturnToDepot, t]);

  // Calculer les valeurs dérivées
  const totalSteps = stepsWithStatus.length;
  const paymentStepId = getPaymentStepId(addresses?.length || 2);

  const currentStepConfig = useMemo(
    () => stepsWithStatus.find((s) => s.id === currentStep),
    [stepsWithStatus, currentStep],
  );

  const isAtPaymentStep = useMemo(
    () => isPaymentStep(currentStep, stepsWithStatus),
    [currentStep, stepsWithStatus],
  );

  const isCompleted = useMemo(
    () => isJobCompleted(currentStep, stepsWithStatus),
    [currentStep, stepsWithStatus],
  );

  const canAdvance = useMemo(
    () => canAdvanceToStep(currentStep, currentStep + 1, totalSteps),
    [currentStep, totalSteps],
  );

  const nextStepId = useMemo(
    () => (canAdvance ? currentStep + 1 : null),
    [canAdvance, currentStep],
  );

  const progressPercentage = useMemo(() => {
    if (totalSteps <= 1) return 0;
    // Step 0 = 0%, dernier step = 100%
    return Math.round((currentStep / (totalSteps - 1)) * 100);
  }, [currentStep, totalSteps]);

  // Helpers
  const getStatus = (stepId: number): StepStatus =>
    getStepStatus(stepId, currentStep);

  const getName = (stepId: number): string =>
    getStepName(stepId, stepsWithStatus);

  const getConfig = (stepId: number): JobStepConfig | undefined =>
    getStepConfig(stepId, stepsWithStatus);

  const canGoTo = (stepId: number): boolean =>
    canAdvanceToStep(currentStep, stepId, totalSteps);

  return {
    steps: stepsWithStatus,
    totalSteps,
    currentStep,
    currentStepConfig,
    paymentStepId,
    isAtPaymentStep,
    isCompleted,
    progressPercentage,
    canAdvance,
    nextStepId,
    getStatus,
    getName,
    getConfig,
    canGoTo,
  };
}

/**
 * Traductions par défaut si les clés ne sont pas trouvées
 */
function getDefaultTranslation(key: string): string {
  const defaults: Record<string, string> = {
    "jobSteps.notStarted": "Job pas commencé",
    "jobSteps.notStartedShort": "Pas commencé",
    "jobSteps.notStartedDesc": "Le job n'a pas encore démarré",
    "jobSteps.departure": "Départ du dépôt",
    "jobSteps.departureShort": "Départ",
    "jobSteps.departureDesc": "Départ du dépôt vers la première adresse",
    "jobSteps.arrivalAddress": "Arrivée adresse {n}",
    "jobSteps.endAddress": "Fin adresse {n}",
    "jobSteps.returnDepot": "Retour au dépôt",
    "jobSteps.returnDepotShort": "Retour",
    "jobSteps.returnDepotDesc": "Retour au dépôt - Fin du job",
  };

  return defaults[key] || key;
}

export default useJobSteps;
