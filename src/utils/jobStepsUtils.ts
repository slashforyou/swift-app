/**
 * Job Steps Utilities - Fonctions utilitaires partagées pour la gestion des étapes de job
 *
 * ⚠️ Ce fichier utilise maintenant JobStepsConfig.ts comme source unique de vérité
 *
 * Règles métier :
 * - Step 0 : Job pas commencé
 * - Step 1 : Départ du dépôt
 * - Step 2 : Arrivée adresse 1
 * - Step 3 : Fin adresse 1
 * - Step 4 : Arrivée adresse 2
 * - Step 5 : Fin adresse 2 → PAIEMENT
 * - Step 6 : Retour au dépôt (optionnel)
 *
 * Formule : Pour N adresses → Total steps = 1 + 2×N + 1 (retour optionnel)
 */

import {
  generateStepsWithStatus,
  calculateTotalSteps,
  getPaymentStepId,
  canAdvanceToStep,
  isJobCompleted,
  isPaymentStep,
  getStepStatus,
  getStepName as getStepNameFromConfig,
  JobStepWithStatus,
  StepStatus,
} from "../constants/JobStepsConfig";

// Re-export du type pour compatibilité avec le code existant
export interface JobStep {
  id: number;
  name?: string;
  title?: string;
  description: string;
  status: "completed" | "current" | "pending";
  icon: string;
  estimatedDuration?: string;
}

/**
 * Génère les étapes du job de manière dynamique basée sur les adresses
 *
 * @param job - Objet job avec addresses et current_step
 * @returns Liste des steps avec leur statut
 */
export const generateJobSteps = (job: any): JobStep[] => {
  const currentStep = job?.step?.actualStep ?? job?.current_step ?? 0;
  const addresses = job?.addresses || [
    { street: "Adresse 1" },
    { street: "Adresse 2" },
  ];
  const includeReturnToDepot = job?.include_return_to_depot !== false;

  const stepsWithStatus = generateStepsWithStatus(
    addresses,
    currentStep,
    includeReturnToDepot,
  );

  // Convertir au format legacy pour compatibilité
  return stepsWithStatus.map((step: JobStepWithStatus) => ({
    id: step.id,
    name: step.name,
    title: step.name,
    description: step.description,
    status: step.status,
    icon: step.icon,
    estimatedDuration: undefined, // Pas utilisé dans le nouveau système
  }));
};

/**
 * Calcule le nombre total de steps pour un job
 *
 * @param job - Objet job avec addresses
 * @returns Nombre total de steps
 */
export const getTotalSteps = (job: any): number => {
  const addresses = job?.addresses || [];
  const addressCount = addresses.length || 2; // Minimum 2 adresses
  const includeReturnToDepot = job?.include_return_to_depot !== false;
  return calculateTotalSteps(addressCount, includeReturnToDepot);
};

/**
 * Calcule le pourcentage de progression
 *
 * @param job - Objet job
 * @returns Pourcentage de 0 à 100
 */
export const calculateProgressPercentage = (job: any): number => {
  const currentStep = job?.step?.actualStep ?? job?.current_step ?? 0;
  const totalSteps = getTotalSteps(job);

  if (job?.progress) {
    return typeof job.progress === "number"
      ? job.progress
      : parseFloat(job.progress);
  }

  // Progression : step 0 = 0%, dernier step = 100%
  if (totalSteps <= 1) return 0;
  return Math.round((currentStep / (totalSteps - 1)) * 100);
};

/**
 * Calcule la progression pour les animations (0-1)
 *
 * @param job - Objet job
 * @returns Progression de 0 à 1
 */
export const calculateAnimationProgress = (job: any): number => {
  const currentStep = job?.step?.actualStep ?? job?.current_step ?? 0;
  const totalSteps = getTotalSteps(job);

  if (job?.progress) {
    const progress =
      typeof job.progress === "number"
        ? job.progress
        : parseFloat(job.progress);
    return progress / 100;
  }

  if (totalSteps <= 1) return 0;
  return currentStep / (totalSteps - 1);
};

/**
 * Obtient l'étape actuelle (0 si pas commencé)
 *
 * @param job - Objet job
 * @returns Numéro du step actuel
 */
export const getCurrentStep = (job: any): number => {
  return job?.step?.actualStep ?? job?.current_step ?? 0;
};

/**
 * Obtient l'index de l'étape actuelle dans le tableau des steps
 * (équivalent à getCurrentStep car les IDs commencent à 0)
 *
 * @param job - Objet job
 * @returns Index du step actuel
 */
export const getCurrentStepIndex = (job: any): number => {
  return getCurrentStep(job);
};

/**
 * Vérifie si on peut avancer vers un step donné
 * Règle : On ne peut avancer que d'un step à la fois, jamais reculer
 *
 * @param stepId - ID du step cible
 * @param job - Objet job
 * @returns true si on peut avancer
 */
export const isStepClickable = (stepId: number, job: any): boolean => {
  const currentStep = getCurrentStep(job);
  const totalSteps = getTotalSteps(job);
  return canAdvanceToStep(currentStep, stepId, totalSteps);
};

/**
 * Obtient le nom d'une étape par son ID
 *
 * @param stepId - ID du step
 * @param job - Objet job
 * @returns Nom du step
 */
export const getStepName = (stepId: number, job: any): string => {
  const steps = generateJobSteps(job);
  return steps.find((s) => s.id === stepId)?.name || `Étape ${stepId}`;
};
