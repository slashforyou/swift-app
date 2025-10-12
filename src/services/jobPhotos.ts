/**
 * Service pour la gestion des photos de job
 */
import { getAuthHeaders } from '../utils/auth';
import { ServerData } from '../constants/ServerData';

const API = ServerData.serverUrl;

export interface JobPhoto {
  id: string;
  jobId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadPhotoRequest {
  photo: {
    uri: string;
    type: string;
    name: string;
  };
  description?: string;
}

/**
 * Upload une photo pour un job
 */
export async function uploadJobPhoto(jobId: string, photoData: UploadPhotoRequest): Promise<JobPhoto> {
  const headers = await getAuthHeaders();
  
  // Créer FormData pour l'upload
  const formData = new FormData();
  
  // Ajouter le fichier photo
  formData.append('photo', {
    uri: photoData.photo.uri,
    type: photoData.photo.type || 'image/jpeg',
    name: photoData.photo.name || `job_${jobId}_photo_${Date.now()}.jpg`,
  } as any);
  
  // Ajouter la description si fournie
  if (photoData.description) {
    formData.append('description', photoData.description);
  }

  const res = await fetch(`${API}v1/job/${jobId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to upload photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to upload photo`);
  }

  const data = await res.json();
  return data.photo || data;
}

/**
 * Récupère toutes les photos d'un job
 */
export async function fetchJobPhotos(jobId: string): Promise<JobPhoto[]> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/photos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch job photos' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to fetch job photos`);
  }

  const data = await res.json();
  return data.photos || data || [];
}

/**
 * Supprime une photo d'un job
 */
export async function deleteJobPhoto(jobId: string, photoId: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete photo' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to delete photo`);
  }
}

/**
 * Met à jour la description d'une photo
 */
export async function updateJobPhotoDescription(
  jobId: string, 
  photoId: string, 
  description: string
): Promise<JobPhoto> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API}v1/job/${jobId}/photos/${photoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update photo description' }));
    throw new Error(error.message || `HTTP ${res.status}: Failed to update photo description`);
  }

  const data = await res.json();
  return data.photo || data;
}

/**
 * Helper pour créer un objet photo à partir d'une URI
 */
export function createPhotoFromUri(uri: string, jobId: string): UploadPhotoRequest {
  const timestamp = Date.now();
  const filename = `job_${jobId}_photo_${timestamp}.jpg`;
  
  return {
    photo: {
      uri,
      type: 'image/jpeg',
      name: filename,
    },
  };
}