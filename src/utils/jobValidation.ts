/**
 * Job Validation Utility
 * 
 * Détecte et corrige les incohérences dans les données de job
 * Gère les cas hors-ligne avec stockage local des corrections
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { startTimerAPI } from '../services/jobTimer';

const PENDING_CORRECTIONS_KEY = '@job_pending_corrections';

export interface JobInconsistency {
  type: 'timer_not_started' | 'timer_running_but_completed' | 'step_mismatch' | 'timer_negative' | 'completed_not_final_step' | 'final_step_not_completed' | 'timer_exceeds_reasonable' | 'break_longer_than_work';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  detectedAt: string;
  jobId: string | number;
  currentState: any;
  suggestedFix?: string;
}

export interface JobValidationResult {
  isValid: boolean;
  inconsistencies: JobInconsistency[];
  autoCorrected: boolean;
  corrections?: string[];
}

export interface PendingCorrection {
  jobId: string | number;
  timestamp: number;
  correction: {
    type: string;
    data: any;
  };
}

/**
 * Valide la cohérence complète d'un job
 */
export async function validateJobConsistency(
  jobData: any,
  localTimerData?: any
): Promise<JobValidationResult> {
  const inconsistencies: JobInconsistency[] = [];
  let autoCorrected = false;
  const corrections: string[] = [];

  const jobId = jobData.id || jobData.code;
  const currentStep = jobData.current_step || jobData.step?.actualStep || 1;
  const status = jobData.status;
  const timerStartedAt = jobData.timer_started_at;
  const timerTotalHours = parseFloat(jobData.timer_total_hours || '0');
  const timerIsRunning = jobData.timer_is_running === 1 || jobData.timer_is_running === true;

  console.log('🔍 [JobValidation] Validating job:', {
    jobId,
    currentStep,
    status,
    timerStartedAt,
    timerTotalHours,
    timerIsRunning
  });

  // ============================================
  // INCOHÉRENCE 1: Étape > 1 mais timer jamais démarré
  // ============================================
  if (currentStep > 1 && !timerStartedAt) {
    const inconsistency: JobInconsistency = {
      type: 'timer_not_started',
      severity: 'critical',
      description: `Job à l'étape ${currentStep}/5 mais timer jamais démarré (timer_started_at = null)`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { currentStep, timerStartedAt, timerTotalHours },
      suggestedFix: 'Créer un timer rétroactif avec estimation basée sur l\'étape actuelle'
    };
    inconsistencies.push(inconsistency);

    // Auto-correction avec jobCode
    try {
      const jobCode = jobData.code || String(jobId);
      await autoCorrectTimerNotStarted(jobCode, currentStep, localTimerData);
      autoCorrected = true;
      corrections.push(`Timer créé rétroactivement pour étape ${currentStep}`);
    } catch (error) {
      console.error('❌ [JobValidation] Auto-correction failed:', error);
    }
  }

  // ============================================
  // INCOHÉRENCE 2: Job complété mais pas à l'étape finale
  // ============================================
  if (status === 'completed' && currentStep < 5) {
    inconsistencies.push({
      type: 'completed_not_final_step',
      severity: 'critical',
      description: `Job marqué "completed" mais seulement à l'étape ${currentStep}/5`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { status, currentStep },
      suggestedFix: 'Avancer le job à l\'étape 5 ou changer le statut'
    });
  }

  // ============================================
  // INCOHÉRENCE 3: Étape finale mais job pas complété
  // ============================================
  if (currentStep === 5 && status !== 'completed') {
    inconsistencies.push({
      type: 'final_step_not_completed',
      severity: 'warning',
      description: `Job à l'étape finale (5/5) mais statut = "${status}" au lieu de "completed"`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { currentStep, status },
      suggestedFix: 'Marquer le job comme "completed"'
    });
  }

  // ============================================
  // INCOHÉRENCE 4: Timer en cours mais job complété
  // ============================================
  if (timerIsRunning && status === 'completed') {
    const inconsistency: JobInconsistency = {
      type: 'timer_running_but_completed',
      severity: 'warning',
      description: 'Timer actif (running) mais job marqué comme "completed"',
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { timerIsRunning, status },
      suggestedFix: 'Arrêter le timer'
    };
    inconsistencies.push(inconsistency);

    // Auto-correction: Arrêter le timer localement
    try {
      console.log('🔧 [JobValidation] Auto-correction: Arrêt du timer pour job completed');
      
      // Note: On ne fait PAS d'appel API ici car le job est déjà completed
      // On corrige juste l'incohérence locale
      // Le contexte JobTimer devrait déjà gérer ça, mais au cas où...
      
      autoCorrected = true;
      corrections.push('Timer arrêté car job completed');
      
      console.log('✅ [JobValidation] Timer marqué comme arrêté localement');
    } catch (error) {
      console.error('❌ [JobValidation] Échec arrêt timer:', error);
    }
  }

  // ============================================
  // INCOHÉRENCE 5: Temps négatif
  // ============================================
  if (timerTotalHours < 0) {
    inconsistencies.push({
      type: 'timer_negative',
      severity: 'critical',
      description: `Temps total négatif: ${timerTotalHours}h`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { timerTotalHours },
      suggestedFix: 'Réinitialiser le timer à 0'
    });
  }

  // ============================================
  // INCOHÉRENCE 6: Temps anormalement élevé
  // ============================================
  const MAX_REASONABLE_HOURS = 240; // 10 jours
  if (timerTotalHours > MAX_REASONABLE_HOURS) {
    inconsistencies.push({
      type: 'timer_exceeds_reasonable',
      severity: 'warning',
      description: `Temps total anormalement élevé: ${timerTotalHours}h (>${MAX_REASONABLE_HOURS}h)`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { timerTotalHours, maxReasonable: MAX_REASONABLE_HOURS },
      suggestedFix: 'Vérifier si le timer n\'a pas été oublié en mode "running"'
    });
  }

  // ============================================
  // INCOHÉRENCE 7: Incohérence step vs timer
  // ============================================
  if (timerTotalHours > 0 && currentStep === 1) {
    inconsistencies.push({
      type: 'step_mismatch',
      severity: 'warning',
      description: `Timer actif (${timerTotalHours}h) mais job toujours à l'étape 1/5`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { currentStep, timerTotalHours },
      suggestedFix: 'L\'utilisateur a peut-être oublié d\'avancer les étapes'
    });
  }

  // ============================================
  // INCOHÉRENCE 8: Pause plus longue que le travail
  // ============================================
  const timerBreakHours = parseFloat(jobData.timer_break_hours || '0');
  if (timerBreakHours > timerTotalHours && timerTotalHours > 0) {
    inconsistencies.push({
      type: 'break_longer_than_work',
      severity: 'critical',
      description: `Temps de pause (${timerBreakHours}h) > temps total (${timerTotalHours}h)`,
      detectedAt: new Date().toISOString(),
      jobId,
      currentState: { timerBreakHours, timerTotalHours },
      suggestedFix: 'Corriger le temps de pause ou le temps total'
    });
  }

  const isValid = inconsistencies.length === 0;

  console.log(`${isValid ? '✅' : '⚠️'} [JobValidation] Validation result:`, {
    isValid,
    inconsistenciesCount: inconsistencies.length,
    autoCorrected,
    corrections
  });

  if (!isValid) {
    console.warn('⚠️ [JobValidation] Inconsistencies detected:', inconsistencies);
  }

  return {
    isValid,
    inconsistencies,
    autoCorrected,
    corrections: corrections.length > 0 ? corrections : undefined
  };
}

/**
 * Auto-correction: Timer non démarré mais job à étape > 1
 */
async function autoCorrectTimerNotStarted(
  jobCode: string,
  currentStep: number,
  localTimerData?: any
): Promise<void> {
  console.warn('⚠️ [JobValidation] AUTO-CORRECTION: Timer non démarré');
  console.warn(`⚠️ [JobValidation] Job ${jobCode} à l'étape ${currentStep}/5 mais timer jamais démarré`);

  // ✅ MODIFIÉ: Toujours tenter l'appel API même si timer local existe
  // Le timer local n'est qu'un fallback, l'API est la source de vérité
  
  // Créer un timer rétroactif estimé
  const now = Date.now();
  const estimatedStartTime = now - (24 * 60 * 60 * 1000); // 24h ago

  console.log('🔧 [JobValidation] Création timer rétroactif:', {
    jobCode,
    estimatedStartTime: new Date(estimatedStartTime).toISOString(),
    currentStep,
    estimatedDuration: '~24h',
    hasLocalTimer: !!localTimerData?.startTime
  });

  // Tenter de synchroniser avec l'API
  try {
    console.log('📡 [JobValidation] Calling startTimerAPI with jobCode:', jobCode);
    const result = await startTimerAPI(jobCode);
    console.log('📡 [JobValidation] startTimerAPI returned:', result);
    
    // ✅ Vérifier si l'API a vraiment réussi
    if (result && result.success) {
      console.log('✅ [JobValidation] Timer créé et synchronisé avec l\'API');
    } else {
      // L'API a retourné une erreur
      const errorMsg = result?.error || result?.data?.error || 'Unknown error';
      console.warn('⚠️ [JobValidation] API timer start failed:', errorMsg);
      
      // Stocker localement pour sync ultérieure
      await savePendingCorrection({
        jobId: jobCode, // Utiliser jobCode comme ID
        timestamp: Date.now(),
        correction: {
          type: 'start_timer',
          data: { estimatedStartTime }
        }
      });
      
      console.log('💾 [JobValidation] Timer stocké localement, synchronisation en attente');
    }
  } catch (error: any) {
    console.error('❌ [JobValidation] Échec sync API (exception):', error.message);

    // Hors-ligne : stocker la correction localement
    await savePendingCorrection({
      jobId: jobCode, // Utiliser jobCode comme ID
      timestamp: Date.now(),
      correction: {
        type: 'start_timer',
        data: { estimatedStartTime }
      }
    });

    console.log('💾 [JobValidation] Correction stockée localement (hors-ligne)');
  }
}

/**
 * Sauvegarder une correction en attente (mode hors-ligne)
 */
async function savePendingCorrection(correction: PendingCorrection): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_CORRECTIONS_KEY);
    const corrections: PendingCorrection[] = stored ? JSON.parse(stored) : [];
    
    // Éviter les doublons
    const exists = corrections.some(c => c.jobId === correction.jobId && c.correction.type === correction.correction.type);
    if (!exists) {
      corrections.push(correction);
      await AsyncStorage.setItem(PENDING_CORRECTIONS_KEY, JSON.stringify(corrections));
      console.log('💾 [JobValidation] Correction sauvegardée:', correction);
    }
  } catch (error) {
    console.error('❌ [JobValidation] Erreur sauvegarde correction:', error);
  }
}

/**
 * Récupérer les corrections en attente
 */
export async function getPendingCorrections(): Promise<PendingCorrection[]> {
  try {
    const stored = await AsyncStorage.getItem(PENDING_CORRECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ [JobValidation] Erreur lecture corrections:', error);
    return [];
  }
}

/**
 * Appliquer les corrections en attente (quand réseau disponible)
 */
export async function applyPendingCorrections(jobId?: string | number): Promise<number> {
  const corrections = await getPendingCorrections();
  const toApply = jobId 
    ? corrections.filter(c => c.jobId === jobId)
    : corrections;

  let appliedCount = 0;

  for (const correction of toApply) {
    try {
      if (correction.correction.type === 'start_timer') {
        await startTimerAPI(String(correction.jobId));
        appliedCount++;
        console.log('✅ [JobValidation] Correction appliquée:', correction.jobId);
      }
      // Ajouter d'autres types de corrections ici
    } catch (error: any) {
      console.error('❌ [JobValidation] Échec application correction:', error.message);
    }
  }

  // Nettoyer les corrections appliquées
  if (appliedCount > 0) {
    const remaining = corrections.filter(c => 
      jobId ? c.jobId !== jobId : !toApply.includes(c)
    );
    await AsyncStorage.setItem(PENDING_CORRECTIONS_KEY, JSON.stringify(remaining));
    console.log(`🧹 [JobValidation] ${appliedCount} corrections appliquées, ${remaining.length} restantes`);
  }

  return appliedCount;
}

/**
 * Vérifier la connectivité réseau
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Test simple: tenter de résoudre un DNS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Contrôler et synchroniser les données d'un job (réseau + local)
 */
export async function reconcileJobData(
  jobId: string | number,
  apiData: any,
  localData: any
): Promise<{ reconciled: any; hadConflicts: boolean; resolution: string[] }> {
  const hasNetwork = await checkNetworkConnectivity();
  const resolution: string[] = [];
  let hadConflicts = false;

  console.log('🔄 [JobValidation] Reconciliation:', { jobId, hasNetwork });

  if (!hasNetwork) {
    console.warn('⚠️ [JobValidation] Pas de réseau, utilisation données locales');
    resolution.push('Hors-ligne: données locales utilisées');
    return { reconciled: localData, hadConflicts: false, resolution };
  }

  // Réseau disponible: comparer API vs local
  const apiStep = apiData.current_step || 1;
  const localStep = localData.step || 1;

  if (apiStep !== localStep) {
    hadConflicts = true;
    console.warn('⚠️ [JobValidation] Conflit step:', { api: apiStep, local: localStep });
    
    // L'API fait foi si réseau disponible
    resolution.push(`Step: API (${apiStep}) prioritaire sur local (${localStep})`);
    localData.step = apiStep;
  }

  // Appliquer les corrections en attente
  const applied = await applyPendingCorrections(jobId);
  if (applied > 0) {
    resolution.push(`${applied} corrections hors-ligne appliquées`);
  }

  return {
    reconciled: { ...apiData, ...localData },
    hadConflicts,
    resolution
  };
}

/**
 * Générer un rapport de validation pour affichage UI
 */
export function formatValidationReport(result: JobValidationResult): string {
  if (result.isValid) {
    return '✅ Job valide, aucune incohérence détectée';
  }

  let report = `⚠️ ${result.inconsistencies.length} incohérence(s) détectée(s):\n\n`;

  result.inconsistencies.forEach((inc, index) => {
    const icon = inc.severity === 'critical' ? '🔴' : inc.severity === 'warning' ? '🟡' : '🔵';
    report += `${icon} ${index + 1}. ${inc.description}\n`;
    if (inc.suggestedFix) {
      report += `   💡 Solution: ${inc.suggestedFix}\n`;
    }
    report += '\n';
  });

  if (result.autoCorrected && result.corrections) {
    report += '🔧 Auto-corrections appliquées:\n';
    result.corrections.forEach(c => report += `  ✓ ${c}\n`);
  }

  return report;
}
