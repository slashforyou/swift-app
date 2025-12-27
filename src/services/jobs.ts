// services/jobs.ts
import { ServerData } from '../constants/ServerData';
import { getAuthHeaders } from '../utils/auth';

const API = ServerData.serverUrl;

export interface JobAPI {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_id: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  contact?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  addresses: {
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  }[];
  time: {
    startWindowStart: string;
    startWindowEnd: string;
    endWindowStart?: string;
    endWindowEnd?: string;
  };
  truck?: {
    licensePlate: string;
    name: string;
  };
  estimatedDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  client_id: string;
  status?: JobAPI['status'];
  priority?: JobAPI['priority'];
  addresses: JobAPI['addresses'];
  time: JobAPI['time'];
  truck?: JobAPI['truck'];
  estimatedDuration?: number;
  notes?: string;
}

export interface UpdateJobRequest {
  status?: JobAPI['status'];
  priority?: JobAPI['priority'];
  addresses?: JobAPI['addresses'];
  time?: JobAPI['time'];
  truck?: JobAPI['truck'];
  estimatedDuration?: number;
  notes?: string;
}

// Fonction helper pour faire des appels API avec retry automatique
async function authenticatedFetch(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  });

  // 🔍 DIAGNOSTIC: Log de la réponse HTTP
  // TEMP_DISABLED: console.log(`🔍 [authenticatedFetch] ${options.method || 'GET'} ${url} → ${response.status} ${response.statusText}`);

  // Si 401/403 et qu'on n'a pas encore retry, tenter le refresh
  if ((response.status === 401 || response.status === 403) && retryCount === 0) {
    // TEMP_DISABLED: console.log('🔄 Token expired, attempting refresh...');
    
    const { refreshToken } = await import('../utils/auth');
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      // TEMP_DISABLED: console.log('✅ Token refreshed, retrying request...');
      // Retry avec le nouveau token
      return authenticatedFetch(url, options, retryCount + 1);
    } else {
        const { clearSession } = await import('../utils/auth');
      await clearSession();
      
      // Optionnel: Rediriger vers login
      // NavigationService.navigate('Connection');
    }
  }

  return response;
}

/**
 * Récupère les jobs pour une période donnée (calendrier)
 * Utilise l'endpoint calendar-days qui retourne les données complètes et fiables
 */
export async function fetchJobs(startDate?: Date, endDate?: Date): Promise<JobAPI[]> {
  try {
    // Formater les dates pour l'API calendar-days (DD-MM-YYYY)
    const formatDateForAPI = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Si pas de dates fournies, utiliser le mois courant
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateFormatted = formatDateForAPI(start);
    const endDateFormatted = formatDateForAPI(end);

    // TEMP_DISABLED: console.log(`📡 [fetchJobs] Fetching jobs via calendar-days from ${startDateFormatted} to ${endDateFormatted}`);
    
    const res = await authenticatedFetch(`${API}calendar-days`, {
      method: 'POST',
      body: JSON.stringify({
        startDate: startDateFormatted,
        endDate: endDateFormatted,
      }),
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobs] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch jobs`);
    }

    const data = await res.json();
    
    // 🔍 DIAGNOSTIC: Analyser la structure de calendar-days
    // TEMP_DISABLED: console.log('🔍 [fetchJobs] Calendar-days response type:', typeof data);
    // TEMP_DISABLED: console.log('🔍 [fetchJobs] Calendar-days response:', JSON.stringify(data, null, 2));
    
    // L'endpoint calendar-days peut retourner { jobs: [...] } ou directement [...]
    let jobsArray: any[] = [];
    
    if (Array.isArray(data)) {
      jobsArray = data;
      // TEMP_DISABLED: console.log(`✅ [fetchJobs] Direct array from calendar-days with ${jobsArray.length} jobs`);
    } else if (data && data.jobs && Array.isArray(data.jobs)) {
      jobsArray = data.jobs;
      // TEMP_DISABLED: console.log(`✅ [fetchJobs] Jobs array from calendar-days with ${jobsArray.length} jobs`);
    } else {
      console.warn('⚠️ [fetchJobs] Unexpected calendar-days response format:', data);
      return [];
    }

    return jobsArray;
  } catch (error) {

    console.error('❌ [fetchJobs] Error fetching jobs:', error);
    throw error;
  }
}

/**
 * Récupère un job spécifique par son ID
 */
export async function fetchJobById(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [fetchJobById] Fetching job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'GET',
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobById] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [fetchJobById] Successfully fetched job');
    
    return data;
  } catch (error) {

    console.error('❌ [fetchJobById] Error fetching job:', error);
    throw error;
  }
}

/**
 * Crée un nouveau job
 */
export async function createJob(jobData: CreateJobRequest): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [createJob] Creating job...');
    
    const res = await authenticatedFetch(`${API}v1/jobs`, {
      method: 'POST',
      body: JSON.stringify(jobData),
    });

    if (!res.ok) {
      console.error(`❌ [createJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to create job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [createJob] Successfully created job');
    
    return data;
  } catch (error) {

    console.error('❌ [createJob] Error creating job:', error);
    throw error;
  }
}

/**
 * Met à jour un job existant
 */
export async function updateJob(jobId: string, jobData: UpdateJobRequest): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [updateJob] Updating job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify(jobData),
    });

    if (!res.ok) {
      console.error(`❌ [updateJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to update job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [updateJob] Successfully updated job');
    
    return data;
  } catch (error) {

    console.error('❌ [updateJob] Error updating job:', error);
    throw error;
  }
}

/**
 * Supprime un job
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    // TEMP_DISABLED: console.log('📡 [deleteJob] Deleting job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error(`❌ [deleteJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to delete job`);
    }

    // TEMP_DISABLED: console.log('✅ [deleteJob] Successfully deleted job');
  } catch (error) {

    console.error('❌ [deleteJob] Error deleting job:', error);
    throw error;
  }
}

/**
 * Démarre un job
 */
export async function startJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [startJob] Starting job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/start`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [startJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to start job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [startJob] Successfully started job');
    
    return data;
  } catch (error) {

    console.error('❌ [startJob] Error starting job:', error);
    throw error;
  }
}

/**
 * Met en pause un job
 */
export async function pauseJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [pauseJob] Pausing job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/pause`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [pauseJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to pause job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [pauseJob] Successfully paused job');
    
    return data;
  } catch (error) {

    console.error('❌ [pauseJob] Error pausing job:', error);
    throw error;
  }
}

/**
 * Reprend un job en pause
 */
export async function resumeJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [resumeJob] Resuming job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/resume`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [resumeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to resume job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [resumeJob] Successfully resumed job');
    
    return data;
  } catch (error) {

    console.error('❌ [resumeJob] Error resuming job:', error);
    throw error;
  }
}

/**
 * Complète un job
 */
export async function completeJob(jobId: string): Promise<JobAPI> {
  try {
    // TEMP_DISABLED: console.log('📡 [completeJob] Completing job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/complete`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [completeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to complete job`);
    }

    const data = await res.json();
    // TEMP_DISABLED: console.log('✅ [completeJob] Successfully completed job');
    
    return data;
  } catch (error) {

    console.error('❌ [completeJob] Error completing job:', error);
    throw error;
  }
}

/**
 * Récupère les détails complets d'un job par son CODE (ex: JOB-NERD-URGENT-006)
 * Utilise l'endpoint /v1/job/:code/full
 * Si échec, retour à l'écran précédent
 */
export async function getJobDetails(jobCode: string): Promise<any> {
  // TEMP_DISABLED: console.log(`📡 [getJobDetails] Starting fetch for jobCode: ${jobCode}`);
  
  try {
    const fullUrl = `${API}v1/job/${jobCode}/full`;
    // TEMP_DISABLED: console.log(`📡 [getJobDetails] Fetching job details from URL: ${fullUrl}`);
    
    const res = await authenticatedFetch(fullUrl, {
      method: 'GET',
    });
    
    if (!res.ok) {
      const error = `HTTP ${res.status}: ${res.statusText}`;
      console.error(`❌ [getJobDetails] ${error}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job details`);
    }

    const rawData = await res.json();
    
    // TEMP_DISABLED: console.log('✅ [getJobDetails] Successfully fetched job details from /full endpoint');
    // TEMP_DISABLED: console.log('🔍 [getJobDetails] /full endpoint raw response:', JSON.stringify(rawData, null, 2));

    // Transformer les données au format attendu par useJobDetails
    if (!rawData.success || !rawData.data) {
      throw new Error('Invalid response format from /full endpoint');
    }

    const { data } = rawData;
    
    // ✅ FIX: Transformer current_step en job.step.actualStep
    // L'API retourne current_step dans data.job ET dans data.workflow
    const currentStepFromAPI = data.job?.current_step || data.workflow?.current_step || 0;
    const totalStepsFromAPI = data.workflow?.total_steps || data.addresses?.length || 5;
    
    // TEMP_DISABLED: console.log('🔍 [getJobDetails] Step data from API:', {
      // jobCurrentStep: data.job?.current_step,
      // workflowCurrentStep: data.workflow?.current_step,
      // workflowTotalSteps: data.workflow?.total_steps,
      // finalCurrentStep: currentStepFromAPI,
      // finalTotalSteps: totalStepsFromAPI
    // });
    
    // Format attendu par useJobDetails
    const transformedData = {
      job: {
        ...data.job,
        // ✅ AJOUTER: Créer job.step.actualStep pour la synchronisation
        step: {
          actualStep: currentStepFromAPI,
          totalSteps: totalStepsFromAPI
        },
        // ✅ SIGNATURE: Assurer que signature_blob est bien récupéré
        signature_blob: data.job?.signature_blob || null,
        signature_date: data.job?.signature_date || null
      },
      client: data.client,
      company: data.company,
      trucks: data.trucks || [],
      workers: data.crew || [], // Transformer 'crew' en 'workers'
      // ✅ AJOUTER: Transformer addresses en steps pour totalSteps
      steps: data.addresses || [],
      // ✅ AJOUTER: Garder workflow pour accès direct
      workflow: data.workflow || {},
      items: (data.items || []).map((item: any, index: number) => {
        const transformedItem = {
          ...item,
          id: item.id || item.item_id || `item_${index + 1}`, // Assurer qu'il y a un ID
          checked: item.checked || item.item_checked || false,
          item_checked: item.item_checked || item.checked || false,
        };
        // TEMP_DISABLED: console.log(`[getJobDetails] Item ${index}: Original ID=${item.id}, Final ID=${transformedItem.id}, Name="${item.name}"`);
        return transformedItem;
      }),
      notes: data.notes || [],
      timeline: data.timeline || [],
      addresses: data.addresses || [] // Ajouter les vraies adresses de l'API
    };

    // TEMP_DISABLED: console.log('🔄 [getJobDetails] Data transformed for useJobDetails:', {
      // hasJob: !!transformedData.job,
      // jobId: transformedData.job?.id,
      // jobCode: transformedData.job?.code,
      // hasClient: !!transformedData.client,
      // clientName: `${transformedData.client?.firstName || ''} ${transformedData.client?.lastName || ''}`.trim(),
      // trucksCount: transformedData.trucks.length,
      // workersCount: transformedData.workers.length,
      // itemsCount: transformedData.items.length,
      // notesCount: transformedData.notes.length,
      // addressesCount: transformedData.addresses.length,
      // ✅ AJOUTER: Log du step transformé
      // stepActualStep: transformedData.job?.step?.actualStep,
      // stepTotalSteps: transformedData.job?.step?.totalSteps,
      // ✅ SIGNATURE: Log des champs signature
      // hasSignatureBlob: !!transformedData.job?.signature_blob,
      // signatureBlobPreview: transformedData.job?.signature_blob ? 
        // transformedData.job.signature_blob.substring(0, 50) + '...' : 'null',
      // signatureDate: transformedData.job?.signature_date
    // });
    
    // ✅ AJOUTER: Log détaillé du step pour debug
    // TEMP_DISABLED: console.log('🔍 [getJobDetails] Transformed job.step:', transformedData.job?.step);
    
    // TEMP_DISABLED: console.log('🏠 [getJobDetails] Addresses data:', JSON.stringify(transformedData.addresses, null, 2));

    return transformedData;

  } catch (error) {

    console.error('❌ [getJobDetails] Error fetching job details:', error);
    throw error;
  }
}

/**
 * Ajoute une note à un job
 */
export async function addJobNote(jobId: string, noteData: { type: string; content: string }): Promise<any> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/jobs/${jobId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to add job note`);
  }

  const data = await res.json();
  return data;
}

/**
 * Récupère la timeline d'un job
 */
export async function fetchJobTimeline(jobId: string): Promise<any[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/jobs/${jobId}/timeline`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch job timeline`);
  }

  const data = await res.json();
  return data;
}

/**
 * Ajoute un nouvel item à un job
 */
export async function addJobItem(jobId: string, item: { name: string; quantity: number; description?: string }) {
  // TEMP_DISABLED: console.log(`[addJobItem] Adding item to job ${jobId}:`, item);
  
  const headers = await getAuthHeaders();
  
  // Essayer plusieurs formats d'URL pour diagnostiquer le problème
  const urlsToTry = [
    `${API}swift-app/v1/job/${jobId}/item`,         // Format de la doc
    `${API}/swift-app/v1/job/${jobId}/item`,        // Avec slash
    `${API}v1/job/${jobId}/item`,                   // Sans swift-app
    `${API}/v1/job/${jobId}/item`,                  // Sans swift-app avec slash
    `${API}job/${jobId}/item`,                      // Format minimal
    `${API}/job/${jobId}/item`,                     // Format minimal avec slash
  ];

  // TEMP_DISABLED: console.log(`[addJobItem] API base URL: ${API}`);
  // TEMP_DISABLED: console.log(`[addJobItem] Auth headers:`, headers);

  for (const url of urlsToTry) {try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });

      // TEMP_DISABLED: console.log(`[addJobItem] Response for ${url}: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const data = await res.json();
        // TEMP_DISABLED: console.log(`[addJobItem] Success with URL: ${url}`, data);
        return data;
      } else if (res.status !== 404) {
        // Si ce n'est pas une 404, c'est peut-être le bon endpoint mais avec une autre erreur
        const errorText = await res.text();
        console.error(`[addJobItem] Non-404 error for ${url}:`, errorText);
      }
    } catch (error) {

      console.error(`[addJobItem] Network error for ${url}:`, error);
    }
  }

  // Si aucune URL n'a fonctionné
  throw new Error('Failed to add item: No working endpoint found');
}

/**
 * Met à jour un item d'un job
 */
/**
 * Récupère les items d'un job pour voir leur format exact
 */

// Fonction pour récupérer les détails du job avec ses items réels
export async function getJobWithItems(jobId: string) {
  // TEMP_DISABLED: console.log(`[getJobWithItems] Fetching job ${jobId} to see real item IDs`);
  
  const headers = await getAuthHeaders();
  
  try {
    const res = await fetch(`${API}v1/job/${jobId}`, {
      method: 'GET',
      headers
    });

    if (res.ok) {
      const data = await res.json();
      // TEMP_DISABLED: console.log(`[getJobWithItems] Job data:`, JSON.stringify(data, null, 2));
      
      if (data.items) {
        data.items = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          is_checked: item.is_checked
        }));
      }
      
      return data;
    } else {
      const errorText = await res.text();
      console.error(`[getJobWithItems] API Error:`, errorText);
      return null;
    }
  } catch (error) {

    console.error(`[getJobWithItems] Network error:`, error);
    return null;
  }
}

export async function updateJobItem(jobId: string, itemId: string, updates: { 
  name?: string; 
  quantity?: number; 
  is_checked?: boolean;
  completedQuantity?: number;
}) {
  // TEMP_DISABLED: console.log(`[updateJobItem] Updating item ${itemId} in job ${jobId} with:`, updates);
  
  const headers = await getAuthHeaders();
  
  // URL selon la spécification API fournie
  // API contient déjà /swift-app/, donc on ajoute juste v1/job/...
  const url = `${API}v1/job/${jobId}/item/${itemId}`;
  
  // Préparer le payload selon la spécification API
  const apiPayload: any = {};
  if (updates.name !== undefined) apiPayload.name = updates.name;
  if (updates.quantity !== undefined) apiPayload.quantity = updates.quantity;
  if (updates.is_checked !== undefined) apiPayload.is_checked = updates.is_checked;
  
  // TEMP_DISABLED: console.log(`[updateJobItem] PATCH ${url}`, apiPayload);
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });

    // TEMP_DISABLED: console.log(`[updateJobItem] Response: ${res.status} ${res.statusText}`);
    
    if (res.ok) {
      const data = await res.json();
      // TEMP_DISABLED: console.log(`[updateJobItem] Success:`, data);
      return data;
    } else {
      const errorText = await res.text();
      console.error(`[updateJobItem] API Error:`, errorText);
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }
  } catch (error) {

    console.error(`[updateJobItem] Network/API error:`, error);
    throw error;
  }
}