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

/**
 * Récupère tous les jobs
 */
export async function fetchJobs(): Promise<JobAPI[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/jobs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch jobs' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch jobs`);
  }

  const data = await res.json();
  return data.jobs || data || [];
}

/**
 * Récupère un job spécifique par ID
 */
export async function fetchJobById(jobId: string): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job`);
  }

  const data = await res.json();
  return data.job || data;
}

/**
 * Crée un nouveau job
 */
export async function createJob(jobData: CreateJobRequest): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to create job`);
  }

  const data = await res.json();
  return data.job || data;
}

/**
 * Met à jour un job existant
 */
export async function updateJob(jobId: string, jobData: UpdateJobRequest): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to update job`);
  }

  const data = await res.json();
  return data.job || data;
}

/**
 * Supprime un job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to delete job`);
  }
}

/**
 * Gestion des statuts de job
 */
export async function startJob(jobId: string): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to start job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to start job`);
  }

  const data = await res.json();
  return data.job || data;
}

export async function pauseJob(jobId: string): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/pause`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to pause job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to pause job`);
  }

  const data = await res.json();
  return data.job || data;
}

export async function resumeJob(jobId: string): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to resume job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to resume job`);
  }

  const data = await res.json();
  return data.job || data;
}

export async function completeJob(jobId: string): Promise<JobAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to complete job' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to complete job`);
  }

  const data = await res.json();
  return data.job || data;
}

/**
 * Récupère la timeline d'un job
 */
export async function fetchJobTimeline(jobId: string): Promise<any[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/timeline`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job timeline' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job timeline`);
  }

  const data = await res.json();
  return data.timeline || data || [];
}