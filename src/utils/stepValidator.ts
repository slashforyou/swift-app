/**
 * stepValidator.ts - Détection et correction des incohérences de step
 * 
 * Ce module détecte automatiquement les incohérences entre :
 * - Le currentStep et le status du job
 * - Le currentStep et le temps passé (timeline)
 * - Le currentStep et l'état de complétion
 */

import { updateJobStep } from '../services/jobSteps';

/**
 * Type pour les résultats de validation
 */
export interface StepValidationResult {
  isValid: boolean;
  currentStep: number;
  expectedStep: number;
  reason?: string;
  shouldCorrect: boolean;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Détecte les incohérences de step dans un job
 * 
 * @param job - Objet job complet
 * @param timeline - Timeline du job (optionnelle)
 * @returns Résultat de validation avec recommandations
 */
export function validateJobStep(job: any, timeline?: any[]): StepValidationResult {
  const currentStep = job?.step?.actualStep || 0;
  const status = job?.status || 'pending';
  const totalSteps = job?.steps?.length || 5;
  
  // TEMP_DISABLED: console.log(`🔍 [STEP VALIDATOR] Validating job step: Job ${job?.id}, Step ${currentStep}/${totalSteps}, Status ${status}`);

  // ✅ RÈGLE 1 : Job terminé DOIT être au step final
  if ((status === 'completed' || status === 'cancelled') && currentStep < totalSteps) {
    return {
      isValid: false,
      currentStep,
      expectedStep: totalSteps,
      reason: `Job ${status} mais step = ${currentStep}/${totalSteps}. Devrait être ${totalSteps}/${totalSteps}`,
      shouldCorrect: true,
      severity: 'critical'
    };
  }

  // ✅ RÈGLE 2 : Job au step final DOIT être terminé (WARNING seulement, pas de correction auto)
  if (currentStep === totalSteps && status !== 'completed' && status !== 'cancelled') {
    return {
      isValid: false,
      currentStep,
      expectedStep: totalSteps,
      reason: `Job au step final (${totalSteps}/${totalSteps}) mais status = "${status}". Devrait être "completed"`,
      shouldCorrect: false, // ⚠️ Changé de true à false - Ne pas auto-corriger (risque de boucle)
      severity: 'warning'
    };
  }

  // ✅ RÈGLE 3 : Job en cours ne peut pas être au step 0
  if ((status === 'in-progress' || status === 'paused') && currentStep === 0) {
    return {
      isValid: false,
      currentStep,
      expectedStep: 1,
      reason: `Job "${status}" mais step = 0. Devrait être au minimum 1`,
      shouldCorrect: true,
      severity: 'warning'
    };
  }

  // ✅ RÈGLE 4 : Vérifier la cohérence avec la timeline (si disponible)
  if (timeline && timeline.length > 0) {
    const lastTimelineStep = getLastCompletedStepFromTimeline(timeline);
    
    if (lastTimelineStep > 0 && currentStep < lastTimelineStep) {
      return {
        isValid: false,
        currentStep,
        expectedStep: lastTimelineStep,
        reason: `Timeline indique step ${lastTimelineStep} complété, mais currentStep = ${currentStep}`,
        shouldCorrect: true,
        severity: 'warning'
      };
    }
  }

  // ✅ RÈGLE 5 : Job pending ne devrait pas avoir de step > 0
  if (status === 'pending' && currentStep > 0) {
    return {
      isValid: false,
      currentStep,
      expectedStep: 0,
      reason: `Job "pending" mais step = ${currentStep}. Devrait être 0`,
      shouldCorrect: false, // Ne pas auto-corriger (peut être voulu)
      severity: 'info'
    };
  }

  // ✅ Tout est cohérent
  return {
    isValid: true,
    currentStep,
    expectedStep: currentStep,
    shouldCorrect: false,
    severity: 'info'
  };
}

/**
 * Extrait le dernier step complété depuis la timeline
 * 
 * @param timeline - Timeline du job
 * @returns Numéro du dernier step complété (0 si aucun)
 */
function getLastCompletedStepFromTimeline(timeline: any[]): number {
  if (!timeline || timeline.length === 0) return 0;

  // Chercher les événements de type "step_completed" ou similaire
  const stepEvents = timeline.filter((event: any) => 
    event.type === 'step_completed' || 
    event.action?.includes('step') ||
    event.description?.includes('step')
  );

  if (stepEvents.length === 0) return 0;

  // Trouver le step le plus élevé
  let maxStep = 0;
  stepEvents.forEach((event: any) => {
    const stepMatch = event.description?.match(/step (\d+)/i);
    if (stepMatch) {
      const stepNum = parseInt(stepMatch[1]);
      if (stepNum > maxStep) maxStep = stepNum;
    }
  });

  return maxStep;
}

/**
 * Corrige automatiquement le step d'un job en cas d'incohérence
 * 
 * @param jobCode - Code du job (ex: "JOB-NERD-SCHEDULED-004", PAS l'ID numérique)
 * @param validation - Résultat de validation
 * @returns Promise avec le résultat de la correction
 */
export async function correctJobStep(
  jobCode: string, 
  validation: StepValidationResult
): Promise<{ success: boolean; message: string; newStep?: number }> {
  
  if (validation.isValid) {
    return {
      success: true,
      message: 'Aucune correction nécessaire'
    };
  }

  if (!validation.shouldCorrect) {
    return {
      success: false,
      message: `Incohérence détectée mais correction non recommandée: ${validation.reason}`
    };
  }

  try {
    // TEMP_DISABLED: console.log(`🔧 [STEP VALIDATOR] Correcting job ${jobCode} step from ${validation.currentStep} to ${validation.expectedStep}`);
    
    // Appeler l'API pour corriger le step
    const result = await updateJobStep(jobCode, validation.expectedStep);
    
    // TEMP_DISABLED: console.log(`✅ [STEP VALIDATOR] Step corrected successfully for job ${jobCode}`);
    
    return {
      success: true,
      message: `Step corrigé: ${validation.currentStep} → ${validation.expectedStep}`,
      newStep: validation.expectedStep
    };
    
  } catch (error) {
    console.error('❌ [STEP VALIDATOR] Error correcting step:', error);
    
    return {
      success: false,
      message: `Erreur lors de la correction: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Valide et corrige automatiquement le step si nécessaire
 * 
 * @param jobCode - Code du job (ex: "JOB-NERD-SCHEDULED-004", PAS l'ID numérique)
 * @param job - Objet job complet
 * @param timeline - Timeline du job (optionnelle)
 * @param autoCorrect - Corriger automatiquement (default: false)
 * @returns Promise avec le résultat de validation/correction
 */
export async function validateAndCorrectJobStep(
  jobCode: string,
  job: any,
  timeline?: any[],
  autoCorrect: boolean = false
): Promise<{
  validation: StepValidationResult;
  correction?: { success: boolean; message: string; newStep?: number };
}> {
  
  // 1. Valider le step
  const validation = validateJobStep(job, timeline);
  
  // TEMP_DISABLED: console.log('🔍 [STEP VALIDATOR] Validation result:', validation.isValid ? 'Valid' : `Invalid - ${validation.reason}`);
  
  // 2. Si incohérence détectée et auto-correction activée
  if (!validation.isValid && validation.shouldCorrect && autoCorrect) {
    const correction = await correctJobStep(jobCode, validation);
    
    return {
      validation,
      correction
    };
  }
  
  return {
    validation
  };
}

/**
 * Hook-like function pour obtenir le message utilisateur
 * 
 * @param validation - Résultat de validation
 * @returns Message formaté pour l'utilisateur
 */
export function getValidationMessage(validation: StepValidationResult): string {
  if (validation.isValid) {
    return '✅ Step cohérent avec le job';
  }

  const emoji = validation.severity === 'critical' ? '🔴' : 
                validation.severity === 'warning' ? '⚠️' : 'ℹ️';

  return `${emoji} ${validation.reason}`;
}

/**
 * Détecte si un job nécessite une correction de step
 * Utilisation rapide pour afficher un badge/bouton
 * 
 * @param job - Objet job
 * @returns true si correction recommandée
 */
export function needsStepCorrection(job: any): boolean {
  const validation = validateJobStep(job);
  return !validation.isValid && validation.shouldCorrect;
}
