// services/jobs.ts
import { getAuthHeaders } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

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
  addresses: Array<{
    type: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  }>;
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
  console.log(`🔍 [authenticatedFetch] ${options.method || 'GET'} ${url} → ${response.status} ${response.statusText}`);

  // Si 401/403 et qu'on n'a pas encore retry, tenter le refresh
  if ((response.status === 401 || response.status === 403) && retryCount === 0) {
    console.log('🔄 Token expired, attempting refresh...');
    
    const { refreshToken } = await import('../utils/auth');
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      console.log('✅ Token refreshed, retrying request...');
      // Retry avec le nouveau token
      return authenticatedFetch(url, options, retryCount + 1);
    } else {
      console.log('❌ Token refresh failed, clearing session...');
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

    console.log(`📡 [fetchJobs] Fetching jobs via calendar-days from ${startDateFormatted} to ${endDateFormatted}`);
    
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
    console.log('🔍 [fetchJobs] Calendar-days response type:', typeof data);
    console.log('🔍 [fetchJobs] Calendar-days response:', JSON.stringify(data, null, 2));
    
    // L'endpoint calendar-days peut retourner { jobs: [...] } ou directement [...]
    let jobsArray: any[] = [];
    
    if (Array.isArray(data)) {
      jobsArray = data;
      console.log(`✅ [fetchJobs] Direct array from calendar-days with ${jobsArray.length} jobs`);
    } else if (data && data.jobs && Array.isArray(data.jobs)) {
      jobsArray = data.jobs;
      console.log(`✅ [fetchJobs] Jobs array from calendar-days with ${jobsArray.length} jobs`);
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
    console.log('📡 [fetchJobById] Fetching job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'GET',
    });

    if (!res.ok) {
      console.error(`❌ [fetchJobById] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job`);
    }

    const data = await res.json();
    console.log('✅ [fetchJobById] Successfully fetched job');
    
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
    console.log('📡 [createJob] Creating job...');
    
    const res = await authenticatedFetch(`${API}v1/jobs`, {
      method: 'POST',
      body: JSON.stringify(jobData),
    });

    if (!res.ok) {
      console.error(`❌ [createJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to create job`);
    }

    const data = await res.json();
    console.log('✅ [createJob] Successfully created job');
    
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
    console.log('📡 [updateJob] Updating job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify(jobData),
    });

    if (!res.ok) {
      console.error(`❌ [updateJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to update job`);
    }

    const data = await res.json();
    console.log('✅ [updateJob] Successfully updated job');
    
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
    console.log('📡 [deleteJob] Deleting job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error(`❌ [deleteJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to delete job`);
    }

    console.log('✅ [deleteJob] Successfully deleted job');
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
    console.log('📡 [startJob] Starting job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/start`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [startJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to start job`);
    }

    const data = await res.json();
    console.log('✅ [startJob] Successfully started job');
    
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
    console.log('📡 [pauseJob] Pausing job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/pause`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [pauseJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to pause job`);
    }

    const data = await res.json();
    console.log('✅ [pauseJob] Successfully paused job');
    
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
    console.log('📡 [resumeJob] Resuming job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/resume`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [resumeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to resume job`);
    }

    const data = await res.json();
    console.log('✅ [resumeJob] Successfully resumed job');
    
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
    console.log('📡 [completeJob] Completing job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/complete`, {
      method: 'POST',
    });

    if (!res.ok) {
      console.error(`❌ [completeJob] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to complete job`);
    }

    const data = await res.json();
    console.log('✅ [completeJob] Successfully completed job');
    
    return data;
  } catch (error) {
    console.error('❌ [completeJob] Error completing job:', error);
    throw error;
  }
}

/**
 * Récupère les détails complets d'un job par son code (ex: JOB-NERD-URGENT-006)
 * Utilise UNIQUEMENT l'endpoint /v1/job/:code/full
 * Si échec, retour à l'écran précédent
 */
export async function getJobDetails(jobId: string): Promise<any> {
  const startTime = performance.now();
  
  console.log(`📡 [getJobDetails] Starting fetch for jobId: ${jobId}`);
  
  try {
    const fullUrl = `${API}v1/job/${jobId}/full`;
    console.log(`📡 [getJobDetails] Fetching job details from URL: ${fullUrl}`);
    
    const res = await authenticatedFetch(fullUrl, {
      method: 'GET',
    });
    
    if (!res.ok) {
      const error = `HTTP ${res.status}: ${res.statusText}`;
      console.error(`❌ [getJobDetails] ${error}`);
      throw new Error(`HTTP ${res.status}: Failed to fetch job details`);
    }

    const rawData = await res.json();
    const apiDuration = performance.now() - startTime;
    
    console.log('✅ [getJobDetails] Successfully fetched job details from /full endpoint');
    console.log('🔍 [getJobDetails] /full endpoint raw response:', JSON.stringify(rawData, null, 2));

    // Transformer les données au format attendu par useJobDetails
    if (!rawData.success || !rawData.data) {
      throw new Error('Invalid response format from /full endpoint');
    }

    const { data } = rawData;
    
    // Format attendu par useJobDetails
    const transformedData = {
      job: data.job,
      client: data.client,
      company: data.company,
      trucks: data.trucks || [],
      workers: data.crew || [], // Transformer 'crew' en 'workers'
      items: data.items || [],
      notes: data.notes || [],
      timeline: data.timeline || []
    };

    console.log('🔄 [getJobDetails] Data transformed for useJobDetails:', {
      hasJob: !!transformedData.job,
      jobId: transformedData.job?.id,
      jobCode: transformedData.job?.code,
      hasClient: !!transformedData.client,
      clientName: `${transformedData.client?.firstName || ''} ${transformedData.client?.lastName || ''}`.trim(),
      trucksCount: transformedData.trucks.length,
      workersCount: transformedData.workers.length,
      itemsCount: transformedData.items.length,
      notesCount: transformedData.notes.length
    });

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
 * Ajoute un item à un job
 */
export async function addJobItem(jobId: string, itemData: { name: string; quantity: number; description?: string }): Promise<any> {
  try {
    console.log('📦 [addJobItem] Adding item to job:', jobId);
    
    const res = await authenticatedFetch(`${API}v1/job/${jobId}/item`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      console.error(`❌ [addJobItem] HTTP ${res.status}: ${res.statusText}`);
      throw new Error(`HTTP ${res.status}: Failed to add item to job`);
    }

    const data = await res.json();
    console.log('✅ [addJobItem] Successfully added item');
    
    return data;
  } catch (error) {
    console.error('❌ [addJobItem] Error adding item:', error);
    throw error;
  }
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