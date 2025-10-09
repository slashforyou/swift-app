// services/jobNotes.ts
import { getAuthHeaders } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

const API = ServerData.serverUrl;

export interface JobNoteAPI {
  id: string;
  jobId: string;
  content: string;
  type?: 'general' | 'important' | 'client' | 'internal';
  author?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobNoteRequest {
  content: string;
  type?: JobNoteAPI['type'];
}

export interface UpdateJobNoteRequest {
  content?: string;
  type?: JobNoteAPI['type'];
}

/**
 * Récupère toutes les notes d'un job
 */
export async function fetchJobNotes(jobId: string): Promise<JobNoteAPI[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job notes' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job notes`);
  }

  const data = await res.json();
  return data.notes || data || [];
}

/**
 * Récupère une note spécifique d'un job
 */
export async function fetchJobNoteById(jobId: string, noteId: string): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job note' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job note`);
  }

  const data = await res.json();
  return data.note || data;
}

/**
 * Ajoute une note à un job
 */
export async function addJobNote(jobId: string, noteData: CreateJobNoteRequest): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to add job note' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to add job note`);
  }

  const data = await res.json();
  return data.note || data;
}

/**
 * Met à jour une note de job
 */
export async function updateJobNote(jobId: string, noteId: string, noteData: UpdateJobNoteRequest): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update job note' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to update job note`);
  }

  const data = await res.json();
  return data.note || data;
}

/**
 * Supprime une note de job
 */
export async function deleteJobNote(jobId: string, noteId: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete job note' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to delete job note`);
  }
}

/**
 * Crée une note autonome (pas liée à un job spécifique)
 */
export async function createStandaloneNote(noteData: CreateJobNoteRequest): Promise<JobNoteAPI> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create note' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to create note`);
  }

  const data = await res.json();
  return data.note || data;
}