/**
 * ⚠️ DEPRECATED - This service is no longer used
 * 
 * All functionality has been migrated to jobSteps.ts which uses working API endpoints:
 * - POST /jobs/{id}/advance-step → PATCH /job/{id}/step ✅
 * - POST /jobs/{id}/timer/start → startJob() using PATCH /job/{id}/step ✅
 * - POST /jobs/{id}/complete → completeJob() using PATCH /job/{id}/step ✅
 * 
 * These endpoints returned 404 "Not Found" and have been replaced.
 * See jobSteps.ts for the new implementation.
 * 
 * @deprecated Since November 5, 2025
 * @see jobSteps.ts
 * 
 * ---
 * Service de synchronisation du Timer vers l'API
 * Envoie les données de timer (temps, steps, breaks) au backend
 */

import { ServerData } from '../constants/ServerData';
import { JobStepTime, JobTimerData } from '../hooks/useJobTimer';
import { getAuthHeaders } from '../utils/auth';

const API = ServerData.serverUrl;

export interface TimerSyncData {
  jobId: string;
  currentStep: number;
  totalElapsedMs: number;
  totalBreakMs: number;
  billableMs: number;
  isRunning: boolean;
  stepHistory: {
    step: number;
    stepName: string;
    startedAt: string;
    completedAt?: string;
    durationMs: number;
    breakMs?: number;
  }[];
}

/**
 * Convertir JobTimerData en format API
 */
function convertTimerDataToAPI(timerData: JobTimerData): TimerSyncData {
  const totalElapsedMs = timerData.totalElapsed;
  const totalBreakMs = timerData.totalBreakTime || 0;
  const billableMs = Math.max(0, totalElapsedMs - totalBreakMs);

  // Convertir stepTimes en step_history pour l'API
  const stepHistory = timerData.stepTimes.map((step: JobStepTime) => ({
    step: step.step,
    stepName: step.stepName,
    startedAt: new Date(step.startTime).toISOString(),
    completedAt: step.endTime ? new Date(step.endTime).toISOString() : undefined,
    durationMs: step.duration || 0,
    breakMs: 0 // Note: Breaks per step not implemented (deprecated service)
  }));

  return {
    jobId: timerData.jobId,
    currentStep: timerData.currentStep,
    totalElapsedMs,
    totalBreakMs,
    billableMs,
    isRunning: timerData.isRunning,
    stepHistory
  };
}

/**
 * 🔄 Synchroniser l'état complet du timer vers l'API
 * Appelé après chaque modification du timer
 */
export async function syncTimerToAPI(timerData: JobTimerData): Promise<any> {
  try {
    const syncData = convertTimerDataToAPI(timerData);

      // jobId: syncData.jobId,
      // currentStep: syncData.currentStep,
      // totalElapsedHours: (syncData.totalElapsedMs / (1000 * 60 * 60)).toFixed(2),
      // billableHours: (syncData.billableMs / (1000 * 60 * 60)).toFixed(2),
      // isRunning: syncData.isRunning,
      // stepsCount: syncData.stepHistory.length
    // });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API}v1/job/${syncData.jobId}/timer`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        current_step: syncData.currentStep,
        total_elapsed_hours: syncData.totalElapsedMs / (1000 * 60 * 60),
        total_break_hours: syncData.totalBreakMs / (1000 * 60 * 60),
        billable_hours: syncData.billableMs / (1000 * 60 * 60),
        is_running: syncData.isRunning,
        step_history: syncData.stepHistory.map(step => ({
          step: step.step,
          step_name: step.stepName,
          started_at: step.startedAt,
          completed_at: step.completedAt,
          duration_hours: step.durationMs / (1000 * 60 * 60),
          break_hours: (step.breakMs || 0) / (1000 * 60 * 60)
        }))
      })
    });

    const data = await response.json();
    return data;

  } catch (error: any) {

    console.error('❌ [syncTimerToAPI] Failed to sync timer:', error);
    console.error('❌ [syncTimerToAPI] Error details:', error.response?.data || error.message);
    // Ne pas throw - mode offline-first
    // L'app continue à fonctionner même si la sync échoue
    return null;
  }
}

/**
 * 🚀 Démarrer le timer (Step 0 → 1)
 * ✅ SESSION 9: Utilise POST /job/:id/start au lieu de /timer/start (endpoint réel du backend)
 * 
 * @param jobCodeOrId - Job CODE (ex: JOB-DEC-002) OU ID numérique (ex: 8)
 *                      Le backend n'accepte QUE l'ID numérique
 */
export async function startTimerAPI(jobCodeOrId: string): Promise<any> {
  try {
    // ✅ SESSION 9 FIX: Le backend veut l'ID numérique, pas le CODE
    // Extraire ID numérique depuis CODE (JOB-DEC-002 -> 2) ou depuis ID direct (8 -> 8)
    let numericId = jobCodeOrId;
    
    // Si c'est un CODE (contient des lettres), extraire l'ID
    if (/[a-zA-Z]/.test(jobCodeOrId)) {
      // Extraire les chiffres à la fin (JOB-DEC-002 -> 002 -> 2)
      const match = jobCodeOrId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString(); // Enlever zeros leadings: 002 -> 2
      } else {
        console.error('❌ [startTimerAPI] Cannot extract numeric ID from CODE:', jobCodeOrId);
        return { success: false, error: 'Invalid job code format' };
      }
    }
    
    const url = `${API}v1/job/${numericId}/start`;

    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
      // ✅ Body vide {} selon documentation API
    });

    const data = await response.json();
    
    
    // Vérifier si la réponse est un succès
    if (data.error || !response.ok) {
      console.error('❌ [startTimerAPI] Job start failed:', data);
      return { success: false, error: data.error || 'Unknown error', data };
    }
    
    return { success: true, ...data };

  } catch (error: any) {

    console.error('❌ [startTimerAPI] Failed to start timer:', error);
    console.error('❌ [startTimerAPI] Error details:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ⏭️ Avancer le step (avec temps)
 */
export async function advanceStepAPI(
  jobId: string,
  fromStep: number,
  toStep: number,
  stepDurationMs: number
): Promise<any> {
  try {
      // jobId,
      // fromStep,
      // toStep,
      // durationHours: (stepDurationMs / (1000 * 60 * 60)).toFixed(2)
    // });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API}v1/job/${jobId}/advance-step`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        from_step: fromStep,
        to_step: toStep,
        step_duration_hours: stepDurationMs / (1000 * 60 * 60),
        completed_at: new Date().toISOString()
      })
    });

    const data = await response.json();
    return data;

  } catch (error: any) {

    console.error('❌ [advanceStepAPI] Failed to advance step:', error);
    console.error('❌ [advanceStepAPI] Error details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * ⏸️ Mettre en pause
 */
export async function pauseTimerAPI(
  jobId: string,
  currentStep: number,
  totalElapsedMs: number
): Promise<any> {
  try {
      // jobId,
      // currentStep,
      // elapsedHours: (totalElapsedMs / (1000 * 60 * 60)).toFixed(2)
    // });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API}v1/job/${jobId}/timer/pause`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        paused_at: new Date().toISOString(),
        current_step: currentStep,
        total_elapsed_hours: totalElapsedMs / (1000 * 60 * 60)
      })
    });

    const data = await response.json();
    return data;

  } catch (error: any) {

    console.error('❌ [pauseTimerAPI] Failed to pause timer:', error);
    console.error('❌ [pauseTimerAPI] Error details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * ▶️ Reprendre après pause
 */
export async function resumeTimerAPI(
  jobId: string,
  breakDurationMs: number
): Promise<any> {
  try {
      // jobId,
      // breakHours: (breakDurationMs / (1000 * 60 * 60)).toFixed(2)
    // });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API}v1/job/${jobId}/timer/resume`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        resumed_at: new Date().toISOString(),
        break_duration_hours: breakDurationMs / (1000 * 60 * 60)
      })
    });

    const data = await response.json();
    return data;

  } catch (error: any) {

    console.error('❌ [resumeTimerAPI] Failed to resume timer:', error);
    console.error('❌ [resumeTimerAPI] Error details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * ✅ Compléter le job
 */
export async function completeJobAPI(
  jobId: string,
  timerData: JobTimerData,
  finalCost: number
): Promise<any> {
  try {
    const syncData = convertTimerDataToAPI(timerData);

      // jobId,
      // billableHours: (syncData.billableMs / (1000 * 60 * 60)).toFixed(2),
      // breakHours: (syncData.totalBreakMs / (1000 * 60 * 60)).toFixed(2),
      // finalCost
    // });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API}v1/job/${jobId}/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        completed_at: new Date().toISOString(),
        total_billable_hours: syncData.billableMs / (1000 * 60 * 60),
        total_break_hours: syncData.totalBreakMs / (1000 * 60 * 60),
        final_cost: finalCost,
        step_history: syncData.stepHistory.map(step => ({
          step: step.step,
          step_name: step.stepName,
          started_at: step.startedAt,
          completed_at: step.completedAt,
          duration_hours: step.durationMs / (1000 * 60 * 60)
        }))
      })
    });

    const data = await response.json();
    return data;

  } catch (error: any) {

    console.error('❌ [completeJobAPI] Failed to complete job:', error);
    console.error('❌ [completeJobAPI] Error details:', error.response?.data || error.message);
    return null;
  }
}
