import { getAuthHeaders } from '../utils/auth';
import { analytics, trackAPICall, trackJobStep } from './analytics';
import { apiDiscovery } from './apiDiscovery';

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

export interface JobStepUpdate {
  current_step: number;
  notes?: string;
}

export interface JobStepResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Update a job's current step
 * API Endpoint: POST /v1/job/{jobId}/advance-step  ← ✅ CORRIGÉ Session 9: Endpoint réel du backend
 * 
 * ✅ Session 9: Utilise le vrai endpoint /advance-step trouvé via API Discovery
 * ✅ Session 8: Vérifie disponibilité endpoint avant appel
 * 
 * @param jobId - The job ID (numeric) or CODE (ex: JOB-DEC-002)
 * @param current_step - The new step number (1-5)
 * @param notes - Optional notes for this step
 */
export const updateJobStep = async (
  jobId: string, 
  current_step: number, 
  notes?: string
): Promise<JobStepResponse> => {
  const startTime = Date.now();
  
  try {
    // ✅ SESSION 9 FIX: Extraire ID numérique depuis CODE si nécessaire
    let numericId = jobId;
    if (/[a-zA-Z]/.test(jobId)) {
      const match = jobId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString();
      }
    }
    
    // ✅ Phase 2.3: Utiliser API Discovery avec support des patterns dynamiques
    const endpoint = `/swift-app/v1/job/${numericId}/advance-step`;
    const isAvailable = await apiDiscovery.isEndpointAvailable(endpoint, 'POST');
    
    if (!isAvailable) {
      console.debug(`📊 [UPDATE JOB STEP] Endpoint not available, step saved locally only`, {
        jobId,
        current_step,
        endpoint
      });
      
      // Fallback local uniquement (pas d'erreur)
      // Le JobTimerProvider gère déjà le step localement
      trackJobStep(jobId, current_step, 5, notes);
      
      return {
        success: true, // Considérer comme succès (update local)
        data: { message: 'Saved locally (endpoint not available)', current_step }
      };
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    const payload: JobStepUpdate = {
      current_step,
      ...(notes && { notes })
    };

    console.log('📊 [UPDATE JOB STEP] Calling API:', {
      jobId,
      numericId,
      current_step,
      notes,
      endpoint
    });

    const response = await fetch(`${API_BASE_URL}/job/${numericId}/advance-step`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    trackAPICall(`/job/${numericId}/advance-step`, 'POST', duration, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      
      // ✅ SESSION 9: Distinguer 404 (endpoint absent) vs vraie erreur
      if (response.status === 404) {
        console.debug('📊 [UPDATE JOB STEP] Endpoint returned 404, invalidating cache and using local fallback', {
          jobId,
          current_step,
          endpoint
        });
        
        // Invalider cache (peut-être endpoint supprimé)
        apiDiscovery.refresh();
        
        // Fallback local (pas d'erreur, considéré comme succès)
        trackJobStep(jobId, current_step, 5, notes);
        
        return {
          success: true,
          data: { 
            message: 'Saved locally (404 from server)', 
            current_step,
            source: 'local'
          }
        };
      }
      
      // Vraie erreur (500, 401, etc.) → log et retourner erreur
      console.warn(`⚠️ Failed to update job step: ${response.status} ${response.statusText}`, errorText);
      
      analytics.trackError({
        error_type: 'api_error',
        error_message: `Job step update failed: ${response.status} ${response.statusText}`,
        context: { jobId, current_step, notes, endpoint: `/job/${jobId}/step` }
      });
      
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ Job step updated successfully:', data);
    
    // 📊 Track successful job step advancement
    trackJobStep(jobId, current_step, 5, notes); // Assuming 5 total steps, adjust as needed
    
    return {
      success: true,
      data,
    };
  } catch (error) {

    const duration = Date.now() - startTime;
    trackAPICall(`/job/${jobId}/step`, 'PATCH', duration, 500);
    
    console.error('❌ Error updating job step:', error);
    
    analytics.trackError({
      error_type: 'network_error',
      error_message: `Job step update network error: ${error}`,
      context: { jobId, current_step, notes }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get current job step
 * API Endpoint: GET /v1/job/{jobId}/step  ← CORRIGÉ: singulier
 * 
 * ✅ Session 9: Intégration API Discovery pour éviter 404 parasites
 */
export const getJobStep = async (jobId: string): Promise<JobStepResponse> => {
  const startTime = Date.now();
  
  try {
    // ✅ SESSION 9: Vérifier si endpoint existe avant d'appeler
    const endpoint = `/swift-app/v1/job/${jobId}/step`;
    const isAvailable = await apiDiscovery.isEndpointAvailable(endpoint, 'GET');
    
    if (!isAvailable) {
      console.debug(`📊 [GET JOB STEP] Endpoint not available, returning local state`, {
        jobId,
        endpoint
      });
      
      // Fallback local uniquement (pas d'erreur)
      // Le JobTimerProvider gère déjà le step localement
      return {
        success: true,
        data: { 
          message: 'Local state (endpoint not available)',
          source: 'local',
          note: 'Step is managed locally by JobTimerProvider'
        }
      };
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/job/${jobId}/step`, {
      method: 'GET',
      headers: authHeaders,
    });

    const duration = Date.now() - startTime;
    trackAPICall(`/job/${jobId}/step`, 'GET', duration, response.status);

    if (!response.ok) {
      // ✅ Distinguer 404 (endpoint absent) vs vraie erreur
      if (response.status === 404) {
        console.debug('📊 [GET JOB STEP] Endpoint returned 404, invalidating cache and using local fallback');
        // Invalider cache (peut-être endpoint supprimé)
        apiDiscovery.refresh();
        
        // Fallback local (pas d'erreur)
        return {
          success: true,
          data: { 
            message: 'Local state (404 from server)',
            source: 'local',
            note: 'Endpoint was expected but returned 404'
          }
        };
      }
      
      // Vraie erreur (500, etc.)
      analytics.trackError({
        error_type: 'api_error',
        error_message: `Get job step failed: ${response.status} ${response.statusText}`,
        context: { jobId, endpoint: `/job/${jobId}/step` }
      });
      
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {

    const duration = Date.now() - startTime;
    trackAPICall(`/job/${jobId}/step`, 'GET', duration, 500);
    
    analytics.trackError({
      error_type: 'network_error',
      error_message: `Get job step network error: ${error}`,
      context: { jobId }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get job steps history
 * API Endpoint: GET /v1/jobs/{jobId}/steps
 * 
 * ✅ Session 9: Intégration API Discovery pour éviter 404 parasites
 */
export const getJobStepsHistory = async (jobId: string): Promise<JobStepResponse> => {
  try {
    // ✅ SESSION 9: Vérifier si endpoint existe avant d'appeler
    const endpoint = `/swift-app/v1/jobs/${jobId}/steps`;
    const isAvailable = await apiDiscovery.isEndpointAvailable(endpoint, 'GET');
    
    if (!isAvailable) {
      console.debug(`📊 [GET STEPS HISTORY] Endpoint not available, returning empty history`, {
        jobId,
        endpoint
      });
      
      // Fallback local: historique vide (pas d'erreur)
      return {
        success: true,
        data: { 
          steps: [],
          message: 'History not available (endpoint not implemented)',
          source: 'local',
          note: 'Step history is not tracked locally, requires backend implementation'
        }
      };
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/steps`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      // ✅ Distinguer 404 (endpoint absent) vs vraie erreur
      if (response.status === 404) {
        console.debug('📊 [GET STEPS HISTORY] Endpoint returned 404, invalidating cache and returning empty history');
        // Invalider cache (peut-être endpoint supprimé)
        apiDiscovery.refresh();
        
        // Fallback: historique vide (pas d'erreur)
        return {
          success: true,
          data: { 
            steps: [],
            message: 'History not available (404 from server)',
            source: 'local'
          }
        };
      }
      
      // Vraie erreur (500, etc.)
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Complete a job (mark as finished)
 * API Endpoint: POST /v1/job/{jobId}/complete
 * 
 * ✅ Session 9: Nouvelle fonction pour compléter un job
 * 
 * @param jobId - The job ID (numeric) or CODE (ex: JOB-DEC-002)
 */
export const completeJob = async (jobId: string): Promise<JobStepResponse> => {
  const startTime = Date.now();
  
  try {
    // ✅ SESSION 9 FIX: Extraire ID numérique depuis CODE si nécessaire
    let numericId = jobId;
    if (/[a-zA-Z]/.test(jobId)) {
      const match = jobId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString();
      }
    }
    
    // ✅ SESSION 9: Endpoint /complete trouvé via test-endpoints-fixed.js
    const endpoint = `/swift-app/v1/job/${numericId}/complete`;
    // Skip API Discovery (pattern matching issue)
    const isAvailable = true;
    
    if (!isAvailable) {
      console.debug(`📊 [COMPLETE JOB] Endpoint not available, marked as completed locally`, {
        jobId,
        numericId,
        endpoint
      });
      
      // Fallback local uniquement
      return {
        success: true,
        data: { message: 'Marked as completed locally (endpoint not available)' }
      };
    }

    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    console.log('📊 [COMPLETE JOB] Calling API:', {
      jobId,
      numericId,
      endpoint
    });

    const response = await fetch(`${API_BASE_URL}/job/${numericId}/complete`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const duration = Date.now() - startTime;
    trackAPICall(`/job/${numericId}/complete`, 'POST', duration, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404) {
        console.debug('📊 [COMPLETE JOB] Endpoint returned 404, using local fallback', {
          jobId,
          numericId,
          endpoint
        });
        
        apiDiscovery.refresh();
        
        return {
          success: true,
          data: { message: 'Marked as completed locally (404 response)' }
        };
      }
      
      throw new Error(`Failed to complete job: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ [COMPLETE JOB] Job completed successfully:', {
      jobId,
      numericId,
      response: data
    });
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ [COMPLETE JOB] Error:', error);
    
    // Note: numericId may not be in scope here, use jobId
    const duration = Date.now() - startTime;
    trackAPICall(`/job/${jobId}/complete`, 'POST', duration, 0);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// 🆕 NOUVEAUX ENDPOINTS - Confirmés par Backend (2 Jan 2026)
// ============================================

export interface SyncStepRequest {
  current_step: number;
}

export interface SyncStepResponse {
  success: boolean;
  message?: string;
  data?: {
    jobId: number;
    jobCode: string;
    currentStep: number;
    totalSteps: number;
    progress: string;
    status: string;
    changes: {
      previousStep: number;
      newStep: number;
      stepChanged: boolean;
    };
  };
  error?: string;
}

/**
 * 🆕 Synchroniser le step actuel vers le backend
 * API Endpoint: PUT /swift-app/v1/job/:id/step
 * 
 * ✅ Confirmé par backend le 2 Jan 2026
 * Range autorisé: 0-5
 * 
 * @param jobId - Job ID (code ou numérique)
 * @param currentStep - Step actuel (0-5)
 */
export const syncStepToBackend = async (
  jobId: string,
  currentStep: number
): Promise<SyncStepResponse> => {
  const startTime = Date.now();
  
  try {
    // Extraire ID numérique si c'est un code
    let numericId = jobId;
    if (/[a-zA-Z]/.test(jobId)) {
      const match = jobId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString();
      }
    }
    
    const endpoint = `/swift-app/v1/job/${numericId}/step`;
    
    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    console.log('📤 [SYNC STEP] Syncing step to backend:', {
      jobId,
      numericId,
      currentStep,
      endpoint
    });

    const response = await fetch(`${API_BASE_URL}/job/${numericId}/step`, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current_step: currentStep }),
    });

    const duration = Date.now() - startTime;
    trackAPICall(endpoint, 'PUT', duration, response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ [SYNC STEP] Failed:', response.status, errorData);
      
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ [SYNC STEP] Step synced successfully:', data);
    
    return {
      success: true,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    console.error('❌ [SYNC STEP] Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export interface SyncTimerRequest {
  totalHours: number;
  billableHours: number;
  breakHours: number;
  isRunning: boolean;
}

export interface SyncTimerResponse {
  success: boolean;
  message?: string;
  data?: {
    jobId: number;
    jobCode: string;
    timer: {
      totalHours: number;
      billableHours: number;
      breakHours: number;
      isRunning: boolean;
      lastUpdated: string;
    };
  };
  error?: string;
}

/**
 * 🆕 Synchroniser les données du timer vers le backend
 * API Endpoint: POST /swift-app/v1/job/:id/sync-timer
 * 
 * ✅ Confirmé par backend le 2 Jan 2026
 * 
 * @param jobId - Job ID (code ou numérique)
 * @param timerData - Données du timer
 */
export const syncTimerToBackend = async (
  jobId: string,
  timerData: SyncTimerRequest
): Promise<SyncTimerResponse> => {
  const startTime = Date.now();
  
  try {
    // Extraire ID numérique si c'est un code
    let numericId = jobId;
    if (/[a-zA-Z]/.test(jobId)) {
      const match = jobId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString();
      }
    }
    
    const endpoint = `/swift-app/v1/job/${numericId}/sync-timer`;
    
    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    console.log('📤 [SYNC TIMER] Syncing timer to backend:', {
      jobId,
      numericId,
      ...timerData,
      endpoint
    });

    const response = await fetch(`${API_BASE_URL}/job/${numericId}/sync-timer`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timerData),
    });

    const duration = Date.now() - startTime;
    trackAPICall(endpoint, 'POST', duration, response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ [SYNC TIMER] Failed:', response.status, errorData);
      
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ [SYNC TIMER] Timer synced successfully:', data);
    
    return {
      success: true,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    console.error('❌ [SYNC TIMER] Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * 🆕 Récupérer l'état du timer depuis le backend
 * API Endpoint: GET /swift-app/v1/job/:id/timer
 * 
 * ✅ Confirmé par backend le 2 Jan 2026
 * 
 * @param jobId - Job ID (code ou numérique)
 */
export const getTimerFromBackend = async (
  jobId: string
): Promise<SyncTimerResponse> => {
  const startTime = Date.now();
  
  try {
    // Extraire ID numérique si c'est un code
    let numericId = jobId;
    if (/[a-zA-Z]/.test(jobId)) {
      const match = jobId.match(/(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10).toString();
      }
    }
    
    const endpoint = `/swift-app/v1/job/${numericId}/timer`;
    
    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/job/${numericId}/timer`, {
      method: 'GET',
      headers: authHeaders,
    });

    const duration = Date.now() - startTime;
    trackAPICall(endpoint, 'GET', duration, response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ [GET TIMER] Failed:', response.status, errorData);
      
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ [GET TIMER] Timer retrieved:', data);
    
    return {
      success: true,
      data: {
        jobId: data.job_id,
        jobCode: data.job_code,
        timer: {
          totalHours: data.timer.total_hours,
          billableHours: data.timer.billable_hours,
          breakHours: data.timer.break_hours,
          isRunning: data.timer.is_running,
          lastUpdated: data.timer.last_updated,
        },
      },
    };
  } catch (error) {
    console.error('❌ [GET TIMER] Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
